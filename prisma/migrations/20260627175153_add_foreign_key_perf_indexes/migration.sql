-- CreateIndex
CREATE INDEX "project_invitations_projectId_idx" ON "project_invitations"("projectId");

-- CreateIndex
CREATE INDEX "project_invitations_invitedBy_idx" ON "project_invitations"("invitedBy");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- CreateIndex
CREATE INDEX "project_members_invitedBy_idx" ON "project_members"("invitedBy");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "tasks_creatorId_idx" ON "tasks"("creatorId");

-- CreateIndex
CREATE INDEX "tasks_projectId_status_idx" ON "tasks"("projectId", "status");

-- CreateIndex
CREATE INDEX "tasks_projectId_assigneeId_idx" ON "tasks"("projectId", "assigneeId");

-- CreateIndex
CREATE INDEX "tasks_projectId_priority_idx" ON "tasks"("projectId", "priority");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_status_dueDate_idx" ON "tasks"("assigneeId", "status", "dueDate");
