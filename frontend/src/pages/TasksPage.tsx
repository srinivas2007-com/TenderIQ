import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BidTask, TeamMember } from '../types';
import { useToast } from '../context/ToastContext';
import { CheckSquare, Plus, Clock, User, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<BidTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Documentation');
  const [newTaskRole, setNewTaskRole] = useState('Bid Manager');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [taskList, teamList] = await Promise.all([
        api.getTasks(),
        api.getTeamMembers(),
      ]);
      setTasks(taskList);
      setTeamMembers(teamList);
    } catch (err: any) {
      error('Failed to load tasks', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (task: BidTask) => {
    const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
    try {
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      success('Task status updated', `Task marked as ${nextStatus}`);
    } catch (err: any) {
      error('Status update failed', err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
      success('Task removed', 'Task has been deleted successfully.');
    } catch (err: any) {
      error('Failed to delete task', err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const tenders = await api.getTenders();
      if (tenders.length === 0) {
        error('Cannot create task', 'Please upload or analyze a tender first.');
        return;
      }
      const created = await api.createTask({
        tender_id: tenders[0].id,
        title: newTaskTitle,
        category: newTaskCategory,
        assignee_role: newTaskRole,
        priority: newTaskPriority,
      });
      setTasks([created, ...tasks]);
      setIsModalOpen(false);
      setNewTaskTitle('');
      success('Task created', 'New bid operational task added.');
    } catch (err: any) {
      error('Task creation failed', err.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bid Workspace Tasks & Team Allocation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated milestone tasks from tender requirements, document checklists, and risk mitigations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Task List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-slate-300 rounded-md p-1.5 bg-white text-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="Documentation">Documentation</option>
                <option value="Technical">Technical</option>
                <option value="Financial">Financial</option>
                <option value="Review">Review</option>
                <option value="Submission">Submission</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-md p-1.5 bg-white text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No bid operational tasks match the selected filters.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isDone = t.status === 'COMPLETED';
                const isInProgress = t.status === 'IN_PROGRESS';
                return (
                  <div
                    key={t.id}
                    className={`bg-white p-4 rounded-xl border transition-all ${
                      isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleStatusToggle(t)}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isInProgress
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : isInProgress ? <Clock className="w-3.5 h-3.5" /> : null}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {t.title}
                          </p>
                          {t.description && <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                            <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                              {t.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                t.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.priority}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {t.assignee_role}
                            </span>
                            {t.is_ai_generated && (
                              <span className="text-blue-600 font-medium">Auto-Generated</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Team Roster & Capacity */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Team Personnel</span>
              <span className="text-xs text-blue-600 font-semibold">{teamMembers.length} Members</span>
            </div>

            <div className="space-y-3">
              {teamMembers.map((m) => (
                <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                      {m.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.email || 'team@tenderiq.ai'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{m.allocated_hours_weekly} hrs allocated weekly</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Add Operational Bid Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Verify turnover certificate with CA seal"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="Documentation">Documentation</option>
                  <option value="Technical">Technical</option>
                  <option value="Financial">Financial</option>
                  <option value="Review">Review</option>
                  <option value="Submission">Submission</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={newTaskRole}
                  onChange={(e) => setNewTaskRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="Bid Manager">Bid Manager</option>
                  <option value="Technical">Technical</option>
                  <option value="Finance">Finance</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
