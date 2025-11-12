import { PrismaClient, Role, ClientStage, PriorityLevel, ProjectStage, TaskStatus, ReviewStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agencyos.test' },
    update: {},
    create: {
      email: 'admin@agencyos.test',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  const developer = await prisma.user.upsert({
    where: { email: 'dev@agencyos.test' },
    update: {},
    create: {
      email: 'dev@agencyos.test',
      name: 'Dev User',
      role: Role.DEVELOPER,
    },
  })

  const clientContact = await prisma.user.upsert({
    where: { email: 'client@brand.com' },
    update: {},
    create: {
      email: 'client@brand.com',
      name: 'Client Stakeholder',
      role: Role.CLIENT,
    },
  })

  const client = await prisma.client.create({
    data: {
      name: 'Acme Co',
      stage: ClientStage.ACTIVE,
      priority: PriorityLevel.HIGH,
      primaryContact: 'Client Stakeholder',
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      notes: 'High-touch ecommerce redesign.',
      projects: {
        create: {
          name: 'Acme Website Redesign',
          description: 'Full redesign for ecommerce storefront.',
          dueDate: new Date(Date.now() + 21 * 24 * 3600 * 1000),
          stage: ProjectStage.DESIGN,
          priority: PriorityLevel.HIGH,
          createdById: admin.id,
          memberships: {
            create: [
              { userId: admin.id, role: Role.ADMIN },
              { userId: developer.id, role: Role.DEVELOPER },
            ],
          },
          tasks: {
            create: [
              {
                title: 'Discovery workshop',
                description: 'Conduct stakeholder interviews.',
                status: TaskStatus.COMPLETE,
                reviewStatus: ReviewStatus.APPROVED,
                priority: PriorityLevel.MEDIUM,
                estimateHours: 6,
                dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
                createdById: admin.id,
                assignments: { create: [{ userId: admin.id }] },
              },
              {
                title: 'Homepage wireframe',
                status: TaskStatus.REVIEW,
                reviewStatus: ReviewStatus.SUBMITTED,
                priority: PriorityLevel.HIGH,
                estimateHours: 8,
                dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
                createdById: developer.id,
                assignments: { create: [{ userId: developer.id }] },
              },
              {
                title: 'Design system tokens',
                status: TaskStatus.IN_PROGRESS,
                reviewStatus: ReviewStatus.DRAFT,
                priority: PriorityLevel.CRITICAL,
                estimateHours: 10,
                dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
                createdById: developer.id,
                assignments: { create: [{ userId: developer.id }] },
              },
              {
                title: 'Client feedback sync',
                status: TaskStatus.BACKLOG,
                reviewStatus: ReviewStatus.DRAFT,
                priority: PriorityLevel.MEDIUM,
                estimateHours: 2,
                dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
                createdById: admin.id,
                assignments: { create: [{ userId: admin.id }] },
              },
              {
                title: 'Accessibility audit',
                status: TaskStatus.BLOCKED,
                reviewStatus: ReviewStatus.DRAFT,
                priority: PriorityLevel.HIGH,
                estimateHours: 6,
                dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
                createdById: developer.id,
                assignments: { create: [{ userId: developer.id }] },
              },
            ],
          },
        },
      },
    },
    include: { projects: true },
  })

  const project = client.projects[0]

  await prisma.reviewRequest.create({
    data: {
      targetType: 'TASK',
      targetId: project.tasks[1].id,
      status: ReviewStatus.SUBMITTED,
      submittedById: developer.id,
      notes: 'Ready for review by admin.',
    },
  })

  await prisma.feedback.createMany({
    data: [
      {
        content: 'Looks great! Minor copy tweaks needed.',
        targetType: 'PROJECT',
        targetId: project.id,
        visibleToClient: true,
        authorId: admin.id,
        projectId: project.id,
      },
      {
        content: 'Need to adjust color contrast for CTA.',
        targetType: 'TASK',
        targetId: project.tasks[2].id,
        visibleToClient: false,
        authorId: developer.id,
        taskId: project.tasks[2].id,
      },
    ],
  })

  await prisma.timeLog.createMany({
    data: [
      {
        userId: admin.id,
        projectId: project.id,
        minutes: 180,
        weekStart: new Date(),
        entryDate: new Date(),
      },
      {
        userId: developer.id,
        projectId: project.id,
        taskId: project.tasks[1].id,
        minutes: 240,
        weekStart: new Date(),
        entryDate: new Date(),
      },
    ],
  })

  const generalThread = await prisma.chatThread.create({
    data: {
      type: 'GENERAL',
      name: 'General',
      participants: {
        create: [
          { userId: admin.id },
          { userId: developer.id },
          { userId: clientContact.id },
        ],
      },
    },
  })

  await prisma.chatMessage.createMany({
    data: [
      {
        threadId: generalThread.id,
        authorId: admin.id,
        content: 'Welcome to AgencyOS! 👋',
      },
      {
        threadId: generalThread.id,
        authorId: developer.id,
        content: 'Starting on the wireframes today.',
      },
    ],
  })

  await prisma.fileObject.create({
    data: {
      key: 'acme/project/brief.pdf',
      filename: 'Project Brief.pdf',
      contentType: 'application/pdf',
      size: 1024,
      url: 'https://example.com/brief.pdf',
      clientId: client.id,
      projectId: project.id,
      uploaderId: admin.id,
    },
  })

  await prisma.calendarEvent.create({
    data: {
      projectId: project.id,
      title: 'Acme Website Launch',
      source: 'PROJECT_DUE_DATE',
      scheduledFor: project.dueDate,
    },
  })

  await prisma.notification.createMany({
    data: [
      { userId: developer.id, type: 'TASK_ASSIGNED', payload: { taskId: project.tasks[1].id } },
      { userId: admin.id, type: 'REVIEW_STATUS', payload: { taskId: project.tasks[1].id, status: 'SUBMITTED' } },
    ],
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
