#!/bin/bash
# Taskmaster AWS rebuild — recreates the target group, ALB, listener,
# and ECS service that teardown.sh removed. Reads config saved by
# teardown.sh, so run this from the same folder that file is in.
#
# One manual step at the end: pointing CloudFront's origin at the new
# ALB DNS name (its address changes every time you recreate the ALB).

set -e

CONFIG_FILE="./taskmaster-rebuild-config.env"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Missing $CONFIG_FILE — run this from the same folder where teardown.sh saved it."
  exit 1
fi
source $CONFIG_FILE

echo "== Recreating target group =="
TG_ARN=$(aws elbv2 create-target-group \
  --name $TG_NAME \
  --protocol HTTP --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/health \
  --region $REGION \
  --query "TargetGroups[0].TargetGroupArn" --output text)
echo "Target group: $TG_ARN"

echo "== Recreating Application Load Balancer =="
SUBNETS_SPACED=$(echo $SUBNET_IDS | tr ',' ' ')
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name $ALB_NAME \
  --subnets $SUBNETS_SPACED \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --region $REGION \
  --query "LoadBalancers[0].LoadBalancerArn" --output text)

echo "Waiting for ALB to become active (~1-2 min)..."
aws elbv2 wait load-balancer-available --load-balancer-arns $ALB_ARN --region $REGION

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --region $REGION --query "LoadBalancers[0].DNSName" --output text)
echo "New ALB DNS: $ALB_DNS"

echo "== Creating HTTP listener → target group =="
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region $REGION

echo "== Recreating ECS service =="
aws ecs create-service \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --task-definition taskmaster-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=taskmaster-backend,containerPort=3001" \
  --region $REGION

echo ""
echo "== Rebuild mostly complete =="
echo "New ALB DNS: $ALB_DNS"
echo ""
echo "MANUAL STEP — update CloudFront's origin (safer via console than CLI):"
echo "  1. CloudFront > Distributions > your distribution > Origins tab"
echo "  2. Edit the origin > change Origin domain to: $ALB_DNS"
echo "  3. Save changes, wait ~5 min for status to return to 'Enabled'"
echo ""
echo "Give the ECS task 60-90 seconds to start and pass health checks, then test:"
echo "  curl http://$ALB_DNS/api/health"