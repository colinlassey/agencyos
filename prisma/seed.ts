import {
  ChannelType,
  ClientStage,
  NotificationType,
  PriorityLevel,
  PrismaClient,
  ProjectStage,
  ReviewStatus,
  Role,
  TaskStatus,
  TimeLogTargetType,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [admin, devA, devB, clientUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@agencyos.test' },
      update: { capacityHrsPerWeek: 35 },
      create: {
        email: 'admin@agencyos.test',
        name: 'Admin User',
        role: Role.ADMIN,
        capacityHrsPerWeek: 35,
      },
    }),
    prisma.user.upsert({
      where: { email: 'dev.one@agencyos.test' },
      update: { capacityHrsPerWeek: 32 },
      create: {
        email: 'dev.one@agencyos.test',
        name: 'Dev One',
        role: Role.DEVELOPER,
        capacityHrsPerWeek: 32,
      },
    }),
    prisma.user.upsert({
      where: { email: 'dev.two@agencyos.test' },
      update: { capacityHrsPerWeek: 30 },
      create: {
        email: 'dev.two@agencyos.test',
        name: 'Dev Two',
        role: Role.DEVELOPER,
        capacityHrsPerWeek: 30,
      },
    }),
    prisma.user.upsert({
      where: { email: 'client@acme.test' },
      update: {},
      create: {
        email: 'client@acme.test',
        name: 'Acme Stakeholder',
        role: Role.CLIENT,
      },
    }),
  ])

  const client = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      nameNormalized: 'acme corporation',
      domain: 'acme.test',
      stage: ClientStage.ACTIVE,
      priority: PriorityLevel.HIGH,
      notes: 'Enterprise ecommerce redesign.',
      contacts: {
        create: { userId: clientUser.id },
      },
    },
  })

  const project = await prisma.project.create({
    data: {
      name: 'Acme Storefront Refresh',
      description: 'Modernize the Acme ecommerce experience across web and mobile.',
      clientId: client.id,
      stage: ProjectStage.DESIGN,
      priority: PriorityLevel.HIGH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      memberships: {
        create: [
          { userId: admin.id, role: Role.ADMIN },
          { userId: devA.id, role: Role.DEVELOPER },
          { userId: devB.id, role: Role.DEVELOPER },
        ],
      },
    },
  })

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Discovery workshop notes',
        description: 'Summarize stakeholder findings.',
        projectId: project.id,
        status: TaskStatus.DONE,
        priority: PriorityLevel.MEDIUM,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        estimateHrs: 4,
        assigneeIds: [admin.id],
      },
    }),
    prisma.task.create({
      data: {
        title: 'Homepage wireframes',
        description: 'Iterate on homepage hero concepts.',
        projectId: project.id,
        status: TaskStatus.REVIEW,
        priority: PriorityLevel.HIGH,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimateHrs: 6,
        assigneeIds: [devA.id],
      },
    }),
    prisma.task.create({
      data: {
        title: 'Component library tokens',
        projectId: project.id,
        status: TaskStatus.DOING,
        priority: PriorityLevel.CRITICAL,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimateHrs: 10,
        assigneeIds: [devA.id, devB.id],
      },
    }),
    prisma.task.create({
      data: {
        title: 'Checkout flow audit',
        projectId: project.id,
        status: TaskStatus.TODO,
        priority: PriorityLevel.MEDIUM,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        estimateHrs: 5,
        assigneeIds: [devB.id],
      },
    }),
    prisma.task.create({
      data: {
        title: 'Accessibility fixes',
        projectId: project.id,
        status: TaskStatus.BLOCKED,
        priority: PriorityLevel.HIGH,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        estimateHrs: 3,
        assigneeIds: [devA.id],
      },
    }),
  ])

  const reviewSubmission = await prisma.reviewSubmission.create({
    data: {
      taskId: tasks[1].id,
      status: ReviewStatus.PENDING,
      submittedById: devA.id,
      reviewerId: admin.id,
      notes: 'Ready for design sign-off.',
    },
  })

  await prisma.feedback.createMany({
    data: [
      {
        content: 'Client requested tighter hero layout.',
        targetType: 'PROJECT',
        targetId: project.id,
        isClientVisible: true,
        authorId: admin.id,
        clientId: client.id,
        projectId: project.id,
      },
      {
        content: 'Confirm contrast ratios for CTA button.',
        targetType: 'TASK',
        targetId: tasks[4].id,
        isClientVisible: false,
        authorId: devB.id,
        projectId: project.id,
        taskId: tasks[4].id,
      },
    ],
  })

  await prisma.timeLog.createMany({
    data: [
      {
        targetType: TimeLogTargetType.PROJECT,
        targetId: project.id,
        projectId: project.id,
        memberId: admin.id,
        hours: 3,
        date: new Date(),
      },
      {
        targetType: TimeLogTargetType.TASK,
        targetId: tasks[2].id,
        projectId: project.id,
        taskId: tasks[2].id,
        memberId: devA.id,
        hours: 2.5,
        date: new Date(),
      },
      {
        targetType: TimeLogTargetType.TASK,
        targetId: tasks[2].id,
        projectId: project.id,
        taskId: tasks[2].id,
        memberId: devB.id,
        hours: 2,
        date: new Date(),
      },
    ],
  })

  const generalChannel = await prisma.channel.create({
    data: {
      type: ChannelType.GENERAL,
      name: 'General',
      participants: {
        create: [admin, devA, devB, clientUser].map((user) => ({ userId: user.id })),
      },
      messages: {
        create: [
          {
            authorId: admin.id,
            content: 'Welcome to AgencyOS – let’s build together!',
          },
        ],
      },
    },
  })

  await prisma.channel.create({
    data: {
      type: ChannelType.PROJECT,
      name: 'Acme Project',
      projectId: project.id,
      participants: {
        create: [admin, devA, devB].map((user) => ({ userId: user.id })),
      },
      messages: {
        create: [
          {
            authorId: devA.id,
            content: 'Wireframes uploaded for review.',
          },
          {
            authorId: admin.id,
            content: 'Review scheduled for tomorrow.',
          },
        ],
      },
    },
  })

  await prisma.channel.create({
    data: {
      type: ChannelType.DM,
      name: '1:1 Admin & Dev',
      participants: {
        create: [admin, devB].map((user) => ({ userId: user.id })),
      },
      messages: {
        create: [
          {
            authorId: devB.id,
            content: 'Can we pair on the accessibility audit tomorrow?',
          },
        ],
      },
    },
  })

  await prisma.file.createMany({
    data: [
      {
        name: 'homepage-wireframe.pdf',
        url: 'https://files.agencyos.test/homepage-wireframe.pdf',
        mime: 'application/pdf',
        size: 1024,
        version: 1,
        clientId: client.id,
        projectId: project.id,
        uploaderId: devA.id,
      },
      {
        name: 'brand-guidelines.pdf',
        url: 'https://files.agencyos.test/brand-guidelines.pdf',
        mime: 'application/pdf',
        size: 2048,
        version: 1,
        clientId: client.id,
        uploaderId: admin.id,
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.REVIEW_STATUS,
        userId: admin.id,
        payload: { kind: 'review-request', reviewId: reviewSubmission.id, taskId: tasks[1].id },
      },
      {
        type: NotificationType.MESSAGE,
        userId: devA.id,
        payload: { kind: 'channel-message', channelId: generalChannel.id },
      },
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
