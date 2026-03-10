import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
    LayoutDashboard, Users as UsersIcon, FolderOpen, CheckSquare,
    Settings, LogOut, ShieldCheck, Mail, Calendar, Edit, Trash2,
    Shield, Activity, Menu, X, UserCircle
} from 'lucide-react';

const AdminDashboard = ({ logout }) => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [usersRes, projectsRes, tasksRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/projects'),
                    api.get('/tasks')
                ]);
                setUsers(usersRes.data);
                setProjects(projectsRes.data);
                setTasks(tasksRes.data);
            } catch (err) {
                console.error('Failed to fetch admin data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
        } catch (err) {
            console.error('Failed to change role', err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/users/${userId}`);
                setUsers(users.filter(u => u.id !== userId));
            } catch (err) {
                console.error('Failed to delete user', err);
            }
        }
    };

    const adminAccount = users.find(u => u.role === 'admin') || { name: 'Admin', email: '', role: 'admin', is_verified: true, created_at: new Date().toISOString() };

    const stats = {
        totalUsers: users.length,
        totalAdmins: users.filter(u => u.role === 'admin').length,
        totalManagers: users.filter(u => u.role === 'manager').length,
        totalProjects: projects.length,
        totalTasks: tasks.length
    };

    // Pseudo activity from newest users and projects
    const activities = [...users.map(u => ({ ...u, type: 'user', time: new Date(u.created_at).getTime() })),
    ...projects.map(p => ({ ...p, type: 'project', time: new Date(p.created_at).getTime() }))]
        .sort((a, b) => b.time - a.time).slice(0, 5);

    const NavItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === id
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-500/30'
                : 'text-indigo-100 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Mobile Header */}
            <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md z-20">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200">AuthForge</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-900 via-indigo-900 to-purple-900 text-white shadow-2xl z-10 transition-transform duration-300 ease-in-out flex flex-col border-r border-indigo-800/50 relative overflow-hidden`}>
                {/* Glow effects */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-purple-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-indigo-500/10 blur-3xl"></div>

                <div className="p-6 flex items-center space-x-3 relative z-10 border-b border-indigo-800/50 hidden md:flex">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">AuthForge</span>
                </div>

                <div className="p-4 flex-1 space-y-2 overflow-y-auto relative z-10 mt-4 md:mt-0">
                    <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <NavItem id="users" label="Users" icon={UsersIcon} />
                    <NavItem id="projects" label="Projects" icon={FolderOpen} />
                    <NavItem id="tasks" label="Tasks" icon={CheckSquare} />
                    <NavItem id="settings" label="Settings" icon={Settings} />
                </div>

                <div className="p-4 border-t border-indigo-800/50 relative z-10">
                    <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-xl transition-all duration-200">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">

                {/* Top Navbar */}
                <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10 hidden md:block">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-end">
                        <div className="flex items-center space-x-4 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-inner text-white font-bold text-sm">
                                {adminAccount.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 leading-none">{adminAccount.name}</span>
                                <span className="text-xs text-gray-500 leading-none mt-1 capitalize">{adminAccount.role}</span>
                            </div>
                            <div className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex items-center">
                                <Shield className="w-3 h-3 mr-1" /> Admin
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-6 lg:p-10 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                            {/* Header Title */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">{activeTab}</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage your system resources and configuration securely.</p>
                                </div>
                            </div>

                            {activeTab === 'dashboard' && (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                        {[
                                            { label: 'Total Users', val: stats.totalUsers, icon: UsersIcon, bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-blue-400' },
                                            { label: 'Admins', val: stats.totalAdmins, icon: ShieldCheck, bg: 'bg-purple-500', from: 'from-purple-600', to: 'to-purple-400' },
                                            { label: 'Managers', val: stats.totalManagers, icon: Edit, bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-indigo-400' },
                                            { label: 'Projects', val: stats.totalProjects, icon: FolderOpen, bg: 'bg-pink-500', from: 'from-pink-600', to: 'to-pink-400' },
                                            { label: 'Tasks', val: stats.totalTasks, icon: CheckSquare, bg: 'bg-rose-500', from: 'from-rose-600', to: 'to-rose-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${stat.from} ${stat.to} rounded-2xl shadow-lg p-6 text-white transform hover:scale-[1.02] transition-transform duration-200`}>
                                                <div className="absolute -right-4 -bottom-4 opacity-20">
                                                    <stat.icon className="w-24 h-24" />
                                                </div>
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <stat.icon className="w-8 h-8 mb-4 opacity-80" />
                                                    <div className="text-4xl font-extrabold mb-1">{stat.val}</div>
                                                    <div className="text-sm font-medium opacity-90">{stat.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Admin Profile Card */}
                                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                                            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                                            <div className="px-6 pb-6 relative">
                                                <div className="w-20 h-20 mx-auto -mt-10 bg-white rounded-full p-1 shadow-md flex items-center justify-center mb-4">
                                                    <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                                        {adminAccount.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-center text-gray-900">{adminAccount.name}</h3>
                                                <p className="text-sm text-center text-indigo-600 font-semibold uppercase tracking-wide mb-6">{adminAccount.role}</p>

                                                <div className="space-y-4">
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <Mail className="w-5 h-5 mr-3 text-indigo-400" />
                                                        <span className="truncate">{adminAccount.email}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <Calendar className="w-5 h-5 mr-3 text-indigo-400" />
                                                        <span>{new Date(adminAccount.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 justify-between">
                                                        <div className="flex items-center">
                                                            <ShieldCheck className="w-5 h-5 mr-3 text-indigo-400" />
                                                            <span>Status</span>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${adminAccount.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {adminAccount.is_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Panel */}
                                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <div className="flex items-center mb-6">
                                                <Activity className="w-6 h-6 text-indigo-500 mr-2" />
                                                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                            </div>
                                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                                {activities.map((act, idx) => (
                                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                            {act.type === 'user' ? <UsersIcon className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                                                        </div>
                                                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 group-hover:bg-indigo-50/50 transition-colors duration-200">
                                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                                <div className="font-bold text-gray-900 text-sm">
                                                                    {act.type === 'user' ? 'New User Registered' : 'Project Created'}
                                                                </div>
                                                                <div className="text-xs font-semibold text-gray-500 shrink-0">
                                                                    {new Date(act.time).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-600 truncate">
                                                                {act.name} {act.email && `(${act.email})`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'users' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {users.map((row) => (
                                                    <tr key={row.id} className="hover:bg-indigo-50/50 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold">
                                                                        {row.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-bold text-gray-900">{row.name}</div>
                                                                    <div className="text-sm text-gray-500">{row.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={row.role}
                                                                onChange={(e) => handleRoleChange(row.id, e.target.value)}
                                                                className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border-none bg-opacity-20 ${row.role === 'admin' ? 'bg-purple-100 text-purple-800 focus:ring-purple-500' :
                                                                    row.role === 'manager' ? 'bg-blue-100 text-blue-800 py-1 px-3 focus:ring-blue-500' :
                                                                        'bg-gray-100 text-gray-800 py-1 px-3 focus:ring-gray-500'
                                                                    }`}
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="manager">Manager</option>
                                                                <option value="user">User</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md ${row.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {row.is_verified ? 'Verified' : 'Unverified'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                            {new Date(row.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button onClick={() => handleDeleteUser(row.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'projects' || activeTab === 'tasks' || activeTab === 'settings') && (
                                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                                    <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">{activeTab} View</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">This section is currently available under the specific module scopes. Navigate using the sidebar.</p>
                                </div>
                            )}

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const UserDashboard = ({ logout, role }) => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const tasksReq = await api.get('/tasks/my').catch(() => ({ data: [] }));
                const projectsReq = await api.get('/projects/my').catch(() => ({ data: [] }));
                const userReq = await api.get('/users/me').catch(() => ({
                    data: {
                        name: authUser?.name || 'User',
                        email: authUser?.email || '',
                        role: authUser?.role || 'user',
                        is_verified: true,
                        created_at: new Date().toISOString()
                    }
                }));

                setTasks(tasksReq.data);
                setProjects(projectsReq.data);
                setProfile(userReq.data);
            } catch (err) {
                console.error('Failed to fetch user dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [authUser]);

    const stats = {
        totalTasks: tasks.length || 0,
        completedTasks: tasks.filter(t => t.status === 'completed').length || 0,
        pendingTasks: tasks.filter(t => t.status !== 'completed').length || 0,
        totalProjects: projects.length || 0
    };

    const activities = [
        ...tasks.map(t => ({ type: 'task', title: `Task assigned: ${t.name || t.title || 'Task'}`, time: new Date(t.created_at || Date.now()).getTime() })),
        ...projects.map(p => ({ type: 'project', title: `Project joined: ${p.name || 'Project'}`, time: new Date(p.created_at || Date.now()).getTime() }))
    ].sort((a, b) => b.time - a.time).slice(0, 5);

    if (activities.length === 0) {
        activities.push({ type: 'system', title: 'Welcome to your dashboard!', time: Date.now() });
    }

    const currentProfile = profile || authUser || {};
    const userName = currentProfile.name || 'User';

    const NavItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === id
                ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-800 font-bold border border-blue-500/30'
                : 'text-indigo-100 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md z-20">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">AuthForge</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-900 via-indigo-900 to-purple-900 text-white shadow-2xl z-10 transition-transform duration-300 ease-in-out flex flex-col border-r border-indigo-800/50 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 right-0 h-32 bg-blue-500/10 blur-3xl"></div>

                <div className="p-6 flex items-center space-x-3 relative z-10 border-b border-indigo-800/50 hidden md:flex">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">AuthForge</span>
                </div>

                <div className="p-4 flex-1 space-y-2 overflow-y-auto relative z-10 mt-4 md:mt-0">
                    <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <NavItem id="profile" label="My Profile" icon={UserCircle} />
                    <NavItem id="projects" label="My Projects" icon={FolderOpen} />
                    <NavItem id="tasks" label="My Tasks" icon={CheckSquare} />
                    <NavItem id="activity" label="Activity" icon={Activity} />
                    <NavItem id="settings" label="Settings" icon={Settings} />
                </div>

                <div className="p-4 border-t border-indigo-800/50 relative z-10">
                    <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-xl transition-all duration-200">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10 hidden md:block">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-end">
                        <div className="flex items-center space-x-4 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-inner text-white font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 leading-none">{userName}</span>
                                <span className="text-xs text-gray-500 leading-none mt-1 capitalize">{role || 'User'}</span>
                            </div>
                            <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center capitalize">
                                <Shield className="w-3 h-3 mr-1" /> {role || 'User'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">{activeTab}</h1>
                                    <p className="mt-1 text-sm text-gray-500">Welcome back, here is your personal overview.</p>
                                </div>
                            </div>

                            {activeTab === 'dashboard' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Assigned Tasks', val: stats.totalTasks, icon: CheckSquare, bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-indigo-400' },
                                            { label: 'Completed Tasks', val: stats.completedTasks, icon: Activity, bg: 'bg-green-500', from: 'from-green-600', to: 'to-green-400' },
                                            { label: 'Pending Tasks', val: stats.pendingTasks, icon: LayoutDashboard, bg: 'bg-amber-500', from: 'from-amber-600', to: 'to-amber-400' },
                                            { label: 'My Projects', val: stats.totalProjects, icon: FolderOpen, bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-blue-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${stat.from} ${stat.to} rounded-2xl shadow-lg p-6 text-white transform hover:scale-[1.02] transition-transform duration-200`}>
                                                <div className="absolute -right-4 -bottom-4 opacity-20">
                                                    <stat.icon className="w-24 h-24" />
                                                </div>
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <stat.icon className="w-8 h-8 mb-4 opacity-80" />
                                                    <div className="text-4xl font-extrabold mb-1">{stat.val}</div>
                                                    <div className="text-sm font-medium opacity-90">{stat.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                                            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                            <div className="px-6 pb-6 relative">
                                                <div className="w-20 h-20 mx-auto -mt-10 bg-white rounded-full p-1 shadow-md flex items-center justify-center mb-4">
                                                    <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                                                        {userName.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-center text-gray-900">{userName}</h3>
                                                <p className="text-sm text-center text-blue-600 font-semibold uppercase tracking-wide mb-6">{currentProfile.role || role}</p>

                                                <div className="space-y-4">
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <Mail className="w-5 h-5 mr-3 text-blue-400" />
                                                        <span className="truncate">{currentProfile.email}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <Calendar className="w-5 h-5 mr-3 text-blue-400" />
                                                        <span>{currentProfile.created_at ? new Date(currentProfile.created_at).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 justify-between">
                                                        <div className="flex items-center">
                                                            <ShieldCheck className="w-5 h-5 mr-3 text-blue-400" />
                                                            <span>Status</span>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${currentProfile.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {currentProfile.is_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <div className="flex items-center mb-6">
                                                <Activity className="w-6 h-6 text-blue-500 mr-2" />
                                                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                            </div>
                                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                                {activities.map((act, idx) => (
                                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                            {act.type === 'task' ? <CheckSquare className="w-4 h-4" /> : act.type === 'system' ? <Activity className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                                                        </div>
                                                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 group-hover:bg-blue-50/50 transition-colors duration-200">
                                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                                <div className="font-bold text-gray-900 text-sm">
                                                                    {act.title}
                                                                </div>
                                                                <div className="text-xs font-semibold text-gray-500 shrink-0">
                                                                    {new Date(act.time).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Task Name</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {tasks.length > 0 ? tasks.map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50/50 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">{row.name || row.title}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">{row.projectName || 'Unassigned'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md ${row.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    row.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {(row.status || 'pending').replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                            {row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">No tasks assigned to you.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'projects' || activeTab === 'profile' || activeTab === 'settings' || activeTab === 'activity') && (
                                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">{activeTab} View</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">This section is currently available under the specific module scopes. Navigate using the sidebar.</p>
                                </div>
                            )}

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();

    if (user?.role === 'admin') {
        return <AdminDashboard logout={logout} />;
    }

    return <UserDashboard logout={logout} role={user?.role} />;
};

export default Dashboard;
