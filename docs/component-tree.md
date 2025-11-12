# Component Trees

## Clients Screen
```
<AppLayout>
  <header>
    <FilterInput />
    <NewClientButton />
  </header>
  <ClientsTable>
    <ClientRow />
  </ClientsTable>
</AppLayout>
```

## Projects Screen
```
<AppLayout>
  <ViewToggle />
  <KanbanBoard>
    <StageColumn>
      <ProjectCard />
    </StageColumn>
  </KanbanBoard>
  <ProjectsTable>
    <ProjectRow />
  </ProjectsTable>
</AppLayout>
```

## Project Detail
```
<AppLayout>
  <ProjectHeader />
  <TasksList>
    <TaskCard>
      <FeedbackList />
    </TaskCard>
  </TasksList>
  <Sidebar>
    <ReviewsPanel />
    <FilesPanel />
  </Sidebar>
</AppLayout>
```

## Team Heatmap
```
<AppLayout>
  <HeatmapTable>
    <MemberRow>
      <WorkloadCell />
    </MemberRow>
  </HeatmapTable>
</AppLayout>
```

## Chat
```
<AppLayout>
  <ThreadsSidebar>
    <ThreadButton />
  </ThreadsSidebar>
  <ChatWindow>
    <MessageList>
      <MessageItem />
    </MessageList>
    <MessageComposer />
  </ChatWindow>
</AppLayout>
```

## Calendar
```
<AppLayout>
  <CalendarHeader />
  <EventsGrid>
    <EventCard />
  </EventsGrid>
</AppLayout>
```

## Files Explorer
```
<AppLayout>
  <FiltersPanel />
  <FilesTable>
    <FileRow />
  </FilesTable>
</AppLayout>
```
