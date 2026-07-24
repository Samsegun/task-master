#!/bin/bash
# Taskmaster AWS teardown — removes the resources that bill per-hour
# (ALB, target group, ECS service) while leaving everything else intact:
# ECR image, ECS cluster + task definition, VPC/subnets/security groups,
# Secrets Manager, IAM role, and the CloudFront distribution.
#
# Run this from any folder — it creates taskmaster-rebuild-config.env
# in that same folder. Keep that file; rebuild.sh needs it.

set -e

REGION="us-east-1"
CLUSTER="taskmaster-cluster"
SERVICE="taskmaster-service"
ALB_NAME="taskmaster-alb"
TG_NAME="taskmaster-tg"
CONFIG_FILE="./taskmaster-rebuild-config.env"

echo "== Saving current network config for later rebuild =="
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=taskmaster-vpc" --region $REGION --query "Vpcs[0].VpcId" --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*public*" --region $REGION --query "Subnets[].SubnetId" --output text | tr '\t' ',')
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=taskmaster-alb-sg" --region $REGION --query "SecurityGroups[0].GroupId" --output text)
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=taskmaster-ecs-sg" --region $REGION --query "SecurityGroups[0].GroupId" --output text)

cat > $CONFIG_FILE <<EOF
VPC_ID=$VPC_ID
SUBNET_IDS=$SUBNET_IDS
ALB_SG_ID=$ALB_SG_ID
ECS_SG_ID=$ECS_SG_ID
REGION=$REGION
CLUSTER=$CLUSTER
SERVICE=$SERVICE
ALB_NAME=$ALB_NAME
TG_NAME=$TG_NAME
EOF

echo "Saved config to $CONFIG_FILE"
echo ""

echo "== Deleting ECS service =="
aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0 --region $REGION || true
aws ecs delete-service --cluster $CLUSTER --service $SERVICE --region $REGION

echo "== Deleting Application Load Balancer =="
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --region $REGION --query "LoadBalancers[0].LoadBalancerArn" --output text)
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $REGION
echo "Waiting for ALB to fully delete (~1-2 min)..."
aws elbv2 wait load-balancers-deleted --load-balancer-arns $ALB_ARN --region $REGION 2>/dev/null || sleep 90

echo "== Deleting target group =="
TG_ARN=$(aws elbv2 describe-target-groups --names $TG_NAME --region $REGION --query "TargetGroups[0].TargetGroupArn" --output text)
aws elbv2 delete-target-group --target-group-arn $TG_ARN --region $REGION

echo ""
echo "== Teardown complete =="
echo "Still running/costing nothing extra: ECR image, ECS cluster + task definition,"
echo "VPC/subnets/security groups, Secrets Manager, IAM role, CloudFront distribution."
echo ""
echo "Note: CloudFront's origin now points at a dead ALB DNS name until you run rebuild.sh."