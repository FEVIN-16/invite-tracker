import { useState, useEffect } from 'react';
import {
  Plus, CheckSquare, Edit2, Trash2, CheckCircle,
  ChevronDown, ChevronUp, MoreVertical, LayoutGrid, Clock,
  ArrowUp, ArrowDown, X, Send, Lock, Unlock, MoreHorizontal,
  Eye, EyeOff
} from 'lucide-react';
import {
  getTaskGroupsByEvent, addTaskGroup, updateTaskGroup, deleteTaskGroup, updateGroupOrders,
  getTasksByEvent, addTask, updateTask, deleteTask, updateTaskOrders, getTasksByGroup,
  toggleGroupLock
} from '../../db/tasksDb';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { Accordion } from '../ui/Accordion';
import { Tooltip } from '../ui/Tooltip';
import { TaskGroupModal } from './TaskGroupModal';
import { TaskModal } from './TaskModal';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

export function TasksTab({ eventId }) {
  const { addToast } = useUIStore();
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  // Inline Task Creation State
  const [activeInlineGroupId, setActiveInlineGroupId] = useState(null);
  const [inlineTaskName, setInlineTaskName] = useState('');
  const [inlineTaskNotes, setInlineTaskNotes] = useState('');

  // Mobile Options State
  const [activeGroupOptions, setActiveGroupOptions] = useState(null);
  const [menuPlacement, setMenuPlacement] = useState('bottom');

  async function fetchData() {
    try {
      const [gs, ts] = await Promise.all([
        getTaskGroupsByEvent(eventId),
        getTasksByEvent(eventId)
      ]);
      setGroups(gs);
      setTasks(ts);
    } catch {
      addToast('Error loading tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [eventId]);

  const handleToggleLock = async (groupId, lockType) => {
    try {
      const updatedGroup = await toggleGroupLock(groupId, lockType);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      addToast(`${lockType === 'isOrderLocked' ? 'Ordering' : 'Completion'} ${updatedGroup[lockType] ? 'locked' : 'unlocked'}`);
    } catch {
      addToast('Error toggling lock', 'error');
    }
  };

  const handleToggleTask = async (task) => {
    const group = groups.find(g => g.id === task.groupId);
    if (group?.isCompletionLocked) {
      addToast('This group is locked for completion changes', 'warning');
      return;
    }

    try {
      const updatedTask = { ...task, isDone: !task.isDone };
      await updateTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      addToast(updatedTask.isDone ? 'Task completed!' : 'Task reopened');
    } catch {
      addToast('Error updating task', 'error');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group and all its tasks?')) return;
    try {
      await deleteTaskGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      setTasks(prev => prev.filter(t => t.groupId !== id));
      addToast('Group deleted');
    } catch {
      addToast('Error deleting group', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Task deleted');
    } catch {
      addToast('Error deleting task', 'error');
    }
  };

  const handleMoveGroup = async (index, direction) => {
    const newGroups = [...groups];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newGroups.length) return;

    // Swap
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];

    // Update orders
    const updatedGroups = newGroups.map((g, i) => ({ ...g, order: i }));
    setGroups(updatedGroups);
    await updateGroupOrders(updatedGroups);
  };

  const handleMoveTask = async (groupTasks, index, direction) => {
    const newTasks = [...groupTasks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newTasks.length) return;

    // Swap
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];

    // Update orders
    const updatedGroupTasks = newTasks.map((t, i) => ({ ...t, order: i }));

    // Update global state
    setTasks(prev => {
      const others = prev.filter(t => t.groupId !== updatedGroupTasks[0].groupId);
      return [...others, ...updatedGroupTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    await updateTaskOrders(updatedGroupTasks);
  };

  const handleCreateTaskInline = async (groupId) => {
    if (!inlineTaskName.trim()) return;

    try {
      const newTask = {
        id: uuidv4(),
        groupId,
        eventId,
        name: inlineTaskName.trim(),
        notes: inlineTaskNotes.trim(),
        isDone: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedTask = await addTask(newTask);
      setTasks(prev => [...prev, savedTask]);
      setInlineTaskName('');
      setInlineTaskNotes('');
      addToast('Task added');
    } catch {
      addToast('Error adding task', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Task Groups</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
            {groups.length} groups · {tasks.length} tasks total
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}
          className="flex-shrink-0"
        >
          <span className="hidden sm:inline">Add Task Group</span>
          <span className="sm:hidden">Add Group</span>
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group, gIndex) => {
            const groupTasks = tasks.filter(t => t.groupId === group.id).sort((a, b) => (a.order || 0) - (b.order || 0));
            const doneTasks = groupTasks.filter(t => t.isDone);
            const isAllDone = groupTasks.length > 0 && doneTasks.length === groupTasks.length;

            return (
              <div key={group.id} className="group/item">
                <Accordion
                  title={
                    <div className="flex items-center gap-2 md:gap-3 py-1">
                      <div className={clsx(
                        "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                        isAllDone ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                      )}>
                        {isAllDone ? <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={clsx(
                            "text-xs md:text-sm font-black uppercase tracking-tight truncate",
                            isAllDone ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                          )}>
                            {group.name}
                          </span>
                          {isAllDone && <span className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Done</span>}
                        </div>
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                          {doneTasks.length}/{groupTasks.length} Done
                        </p>
                      </div>
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={activeInlineGroupId === group.id ? X : Plus}
                        onClick={(e) => { e.stopPropagation(); setActiveInlineGroupId(activeInlineGroupId === group.id ? null : group.id); }}
                        className={clsx(
                          "text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors px-2 md:px-4",
                          activeInlineGroupId === group.id
                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                            : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        )}
                      >
                        <span className="hidden sm:inline-block">{activeInlineGroupId === group.id ? 'Hide Form' : 'Add Task'}</span>
                        <span className="sm:hidden inline-block">{activeInlineGroupId === group.id ? 'Hide' : 'Add'}</span>
                      </Button>

                      {/* Desktop Management Actions */}
                      <div className="hidden md:flex items-center gap-1">
                        <div className="flex items-center gap-0.5 border-r border-gray-100 dark:border-gray-800 pr-1">
                          <Tooltip content={group.isOrderLocked ? "Unlock Ordering" : "Lock Ordering"}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleLock(group.id, 'isOrderLocked'); }}
                              className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                group.isOrderLocked ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              )}
                            >
                              {group.isOrderLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </Tooltip>
                          <Tooltip content={group.isCompletionLocked ? "Unlock Status" : "Lock Status"}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleLock(group.id, 'isCompletionLocked'); }}
                              className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                group.isCompletionLocked ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              )}
                            >
                              <CheckCircle className={clsx("w-3.5 h-3.5", group.isCompletionLocked ? "opacity-100" : "opacity-40")} />
                            </button>
                          </Tooltip>
                          <Tooltip content={group.showTaskActions ? "Hide Task Actions" : "Show Task Actions"}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleLock(group.id, 'showTaskActions'); }}
                              className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                group.showTaskActions ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              )}
                            >
                              {group.showTaskActions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          </Tooltip>
                        </div>

                        <div className="flex items-center border-r border-gray-100 dark:border-gray-800 pr-1">
                          <button
                            disabled={gIndex === 0}
                            onClick={(e) => { e.stopPropagation(); handleMoveGroup(gIndex, -1); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded-lg"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={gIndex === groups.length - 1}
                            onClick={(e) => { e.stopPropagation(); handleMoveGroup(gIndex, 1); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded-lg"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setIsGroupModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  }
                  defaultOpen={!isAllDone}
                >
                  <div className="pt-2 pb-4 px-1">
                    {/* Mobile Management Toolbar */}
                    <div className="flex md:hidden items-center justify-between mb-4 p-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleToggleLock(group.id, 'isOrderLocked')}
                          className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-1.5",
                            group.isOrderLocked ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          {group.isOrderLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-bold uppercase tracking-tight">Order</span>
                        </button>
                        <button
                          onClick={() => handleToggleLock(group.id, 'isCompletionLocked')}
                          className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-1.5",
                            group.isCompletionLocked ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <CheckCircle className={clsx("w-3.5 h-3.5", group.isCompletionLocked ? "opacity-100" : "opacity-40")} />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Status</span>
                        </button>
                        <button
                          onClick={() => handleToggleLock(group.id, 'showTaskActions')}
                          className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-1.5",
                            group.showTaskActions ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          {group.showTaskActions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-bold uppercase tracking-tight">Actions</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            setMenuPlacement(spaceBelow < 200 ? 'top' : 'bottom');
                            setActiveGroupOptions(activeGroupOptions === group.id ? null : group.id);
                          }}
                          className={clsx(
                            "p-2 rounded-lg transition-all active:scale-90",
                            activeGroupOptions === group.id ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-800"
                          )}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeGroupOptions === group.id && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-[60]"
                              onClick={() => setActiveGroupOptions(null)}
                            />
                            {/* Dropdown Menu */}
                            <div className={clsx(
                              "absolute right-0 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 p-1.5 z-[70] animate-in fade-in zoom-in-95 duration-200",
                              menuPlacement === 'top' ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
                            )}>
                              <button
                                onClick={() => { setEditingGroup(group); setIsGroupModalOpen(true); setActiveGroupOptions(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="uppercase tracking-tight">Edit Group</span>
                              </button>
                              <div className="h-px bg-gray-50 dark:bg-gray-800 my-1 mx-2" />
                              <button
                                onClick={() => { handleDeleteGroup(group.id); setActiveGroupOptions(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="uppercase tracking-tight">Delete Group</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Inline Task Form */}
                      {activeInlineGroupId === group.id && (
                        <div className="bg-white dark:bg-gray-900 border-2 border-indigo-500/20 dark:border-indigo-400/20 rounded-xl p-4 shadow-xl animate-in slide-in-from-top-2 duration-200 mb-4">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Add Tasks to {group.name}</span>
                            <button onClick={() => setActiveInlineGroupId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              autoFocus
                              type="text"
                              placeholder="What needs to be done?"
                              value={inlineTaskName}
                              onChange={(e) => setInlineTaskName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateTaskInline(group.id)}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <textarea
                              placeholder="Optional notes..."
                              value={inlineTaskNotes}
                              onChange={(e) => setInlineTaskNotes(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-400 outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px] resize-none"
                            />
                            <div className="flex justify-end pt-1">
                              <Button size="sm" icon={Send} onClick={() => handleCreateTaskInline(group.id)} disabled={!inlineTaskName.trim()}>
                                Add Task
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {groupTasks.map((task, tIndex) => (
                        <div
                          key={task.id}
                          className={clsx(
                            "flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl group/task transition-all shadow-sm",
                            !group.isCompletionLocked && "hover:border-indigo-100 dark:hover:border-indigo-900"
                          )}
                        >
                          <button
                            onClick={() => handleToggleTask(task)}
                            disabled={group.isCompletionLocked}
                            className={clsx(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                              task.isDone
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-400",
                              group.isCompletionLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {task.isDone && <CheckCircle className="w-4 h-4" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              "text-xs md:text-sm font-bold transition-all truncate md:whitespace-normal",
                              task.isDone ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200"
                            )}>
                              {task.name}
                            </p>
                            {task.notes && (
                              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate uppercase tracking-widest leading-none font-bold">
                                {task.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 md:gap-1">
                            {!group.isOrderLocked && (
                              <div className="flex items-center border-r border-gray-100 dark:border-gray-800 pr-1 mr-1">
                                <button
                                  disabled={tIndex === 0}
                                  onClick={() => handleMoveTask(groupTasks, tIndex, -1)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  disabled={tIndex === groupTasks.length - 1}
                                  onClick={() => handleMoveTask(groupTasks, tIndex, 1)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {group.showTaskActions && (
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <button
                                  onClick={() => { setSelectedTask(task); setSelectedGroup(group); setIsTaskModalOpen(true); }}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Accordion>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          heading="No tasks groups yet"
          subtext="Create groups like 'Invitation', 'Reception', or 'Shopping' to manage your event tasks."
          actions={
            <Button icon={Plus} onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}>
              Add First Task Group
            </Button>
          }
        />
      )}

      <TaskGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={fetchData}
        group={editingGroup}
        eventId={eventId}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchData}
        task={selectedTask}
        group={selectedGroup}
        eventId={eventId}
      />
    </div>
  );
}
