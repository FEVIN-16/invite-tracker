import { initDB } from './index';
import { syncManager } from '../services/syncManager';

// Task Groups
export async function getTaskGroupsByEvent(eventId) {
  const db = await initDB();
  const groups = await db.getAllFromIndex('taskGroups', 'eventId', eventId);
  return groups.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function addTaskGroup(group) {
  const db = await initDB();
  const groups = await getTaskGroupsByEvent(group.eventId);
  const maxOrder = groups.reduce((max, g) => Math.max(max, g.order || 0), -1);
  const newGroup = { 
    ...group, 
    order: maxOrder + 1,
    isOrderLocked: false,
    isCompletionLocked: false,
    showTaskActions: false
  };
  
  await db.add('taskGroups', newGroup);
  syncManager.scheduleSync();
  return newGroup;
}

export async function updateTaskGroup(group) {
  const db = await initDB();
  await db.put('taskGroups', group);
  syncManager.scheduleSync();
  return group;
}

export async function toggleGroupLock(groupId, lockType) {
  const db = await initDB();
  const group = await db.get('taskGroups', groupId);
  if (!group) return;
  
  const updatedGroup = {
    ...group,
    [lockType]: !group[lockType],
    updatedAt: new Date().toISOString()
  };
  
  await db.put('taskGroups', updatedGroup);
  syncManager.scheduleSync();
  return updatedGroup;
}

export async function updateGroupOrders(groups) {
  const db = await initDB();
  const tx = db.transaction('taskGroups', 'readwrite');
  for (const group of groups) {
    await tx.store.put(group);
  }
  await tx.done;
  syncManager.scheduleSync();
}

export async function deleteTaskGroup(id) {
  const db = await initDB();
  // Also delete all tasks in this group
  const tasks = await db.getAllFromIndex('tasks', 'groupId', id);
  const tx = db.transaction(['taskGroups', 'tasks'], 'readwrite');
  await tx.objectStore('taskGroups').delete(id);
  for (const task of tasks) {
    await tx.objectStore('tasks').delete(task.id);
  }
  await tx.done;
  syncManager.scheduleSync();
}

// Tasks
export async function getTasksByEvent(eventId) {
  const db = await initDB();
  const tasks = await db.getAllFromIndex('tasks', 'eventId', eventId);
  return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getTasksByGroup(groupId) {
  const db = await initDB();
  const tasks = await db.getAllFromIndex('tasks', 'groupId', groupId);
  return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function addTask(task) {
  const db = await initDB();
  const existing = await getTasksByGroup(task.groupId);
  const maxOrder = existing.reduce((max, t) => Math.max(max, t.order || 0), -1);
  const newTask = { ...task, order: maxOrder + 1 };
  
  await db.add('tasks', newTask);
  syncManager.scheduleSync();
  return newTask;
}

export async function updateTask(task) {
  const db = await initDB();
  await db.put('tasks', task);
  syncManager.scheduleSync();
  return task;
}

export async function updateTaskOrders(tasks) {
  const db = await initDB();
  const tx = db.transaction('tasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
  syncManager.scheduleSync();
}

export async function deleteTask(id) {
  const db = await initDB();
  await db.delete('tasks', id);
  syncManager.scheduleSync();
}
