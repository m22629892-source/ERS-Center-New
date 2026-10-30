
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Shield, User as UserIcon, Trash2, CheckSquare, Square, Plus, Loader2, AlertCircle, Lock, Globe, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import { doc, deleteDoc, writeBatch, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { AdminTable, Column } from '../../components/AdminTable';
import { Modal, ConfirmModal } from '../../components/Modal';

const RolesManagement = () => {
  const { users, user: loggedInUser, logAdminAction } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // States for User Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSingleDeleteModalOpen, setIsSingleDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.USER
  });

  const isSuperAdmin = loggedInUser?.role === UserRole.SUPER_ADMIN;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!isSuperAdmin && u.role === UserRole.SUPER_ADMIN) return false;
      
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter, isSuperAdmin]);

  const handleBulkDelete = async () => {
    const batch = writeBatch(db);
    selectedUsers.forEach(id => {
      batch.delete(doc(db, 'users', id));
    });
    await batch.commit();
    await logAdminAction('BULK_DELETE_USERS', `Deleted ${selectedUsers.length} users`);
    setSelectedUsers([]);
    setIsDeleteModalOpen(false);
  };

  const handlePromptDelete = (u: User) => {
    setDeleteId(u.id);
    setIsSingleDeleteModalOpen(true);
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'users', deleteId));
      await logAdminAction('DELETE_USER', `Deleted user: ${deleteId}`);
      setIsSingleDeleteModalOpen(false);
      setDeleteId(null);
    } catch (err) {
      alert(t("delete_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setCurrentUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: u.password || '',
      role: u.role
    });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setCurrentUser(null);
    setFormData({ name: '', username: '', password: '', role: UserRole.USER });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    try {
      if (currentUser) {
        // تحديث مستخدم موجود
        const userRef = doc(db, 'users', currentUser.id);
        const updateData = {
          name: formData.name.trim(),
          password: formData.password,
          role: formData.role
        };
        await updateDoc(userRef, updateData);
        await logAdminAction('UPDATE_USER', `Updated user: ${currentUser.username}`);
      } else {
        // إنشاء مستخدم جديد
        const id = formData.username.trim().toLowerCase().replace(/\s+/g, '-');
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setModalError(t("username_already_exists"));
          setIsSaving(false);
          return;
        }

        const newUser: User = {
          id,
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          lastHeartbeat: Date.now(),
          status: 'offline'
        };

        await setDoc(doc(db, 'users', id), newUser);
        await logAdminAction('CREATE_USER', `Created user: ${newUser.name}`);
      }
      
      setIsAddModalOpen(false);
    } catch (err) {
      setModalError(t("save_data_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const columns: Column<User>[] = [
    {
      header: 'Selection',
      accessor: (u) => (
        <button onClick={() => toggleSelect(u.id)} className="text-blue-500">
          {selectedUsers.includes(u.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
        </button>
      )
    },
    {
      header: t('full_name'),
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-primary">
            {u.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold dark:text-white text-xs">{u.name}</div>
            <div className="text-[10px] text-gray-500">@{u.username}</div>
          </div>
        </div>
      )
    },
    {
      header: t('role'),
      accessor: (u) => (
        <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase ${
          u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : 
          u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
          u.role === UserRole.RESPONDER ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {u.role}
        </span>
      )
    },
    {
      header: t('status'),
      accessor: (u) => {
        const isOnline = (Date.now() - (u.lastHeartbeat || 0)) < 60000;
        return (
          <div className="flex items-center gap-1">
             <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
             <span className="text-[10px] text-gray-500">{isOnline ? t('online') : t('offline')}</span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 dark:border-gray-700">
        <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
          <Shield size={24} className="text-blue-500" /> {t("user_management")}
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleOpenAdd} className="flex items-center gap-2">
            <Plus size={18} /> {t("add_new_user")}
          </Button>
          {selectedUsers.length > 0 && (
            <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 size={18} className="mr-2"/> {t("delete_selected")} ({selectedUsers.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} className="mr-2 rtl:rotate-180" /> {t('back')}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search size={18} className="absolute top-3 left-3 text-gray-400"/>
          <input 
            type="text" 
            placeholder={t("search_users_placeholder")} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute top-3 left-3 text-gray-400"/>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner appearance-none"
          >
            <option value="all">{t("all_roles")}</option>
            {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.RESPONDER}>Responder</option>
            <option value={UserRole.USER}>User</option>
          </select>
        </div>
      </div>

      <AdminTable 
        columns={columns}
        data={filteredUsers}
        isLoading={false}
        onEdit={handleOpenEdit} 
        onDelete={handlePromptDelete}
        enableSelection={false}
      />

      {/* Modal for Adding/Editing User */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={currentUser ? t("edit_user_data") : t("create_new_account")}
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {modalError}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">{t("full_name")}</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-primary pl-10 text-sm font-bold" 
                placeholder={t("enter_real_name")}
              />
              <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">{t("username")}</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                disabled={!!currentUser}
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-primary pl-10 text-sm font-bold disabled:opacity-50" 
                placeholder={t("username_login")}
              />
              <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">{t("password")}</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-primary pl-10 text-sm font-bold" 
                placeholder={t("password_login")}
              />
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">{t("select_role")}</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
            >
              <option value={UserRole.USER}>{t("role_user")}</option>
              <option value={UserRole.RESPONDER}>{t("role_responder")}</option>
              <option value={UserRole.ADMIN}>{t("role_admin")}</option>
              {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
            </select>
          </div>

          <Button type="submit" disabled={isSaving} fullWidth className="h-12 font-black text-sm">
            {isSaving ? <Loader2 className="animate-spin mx-auto" /> : (currentUser ? t("save_changes") : t("add_user_now"))}
          </Button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleBulkDelete}
        title={t("confirm_bulk_delete")}
        message={t("confirm_bulk_delete_msg", { count: selectedUsers.length })}
      />

      <ConfirmModal 
        isOpen={isSingleDeleteModalOpen} 
        onClose={() => setIsSingleDeleteModalOpen(false)} 
        onConfirm={handleConfirmSingleDelete}
        title={t("delete_user")}
        message={t("confirm_single_delete_user_msg")}
      />
    </div>
  );
};

export default RolesManagement;
