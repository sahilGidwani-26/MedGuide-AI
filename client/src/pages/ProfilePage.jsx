import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Heart, Shield, Save, Loader2, Edit3 } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', dateOfBirth: '', gender: '',
    bloodGroup: '', allergies: '', currentMedications: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: ''
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        bloodGroup: user.bloodGroup || '',
        allergies: (user.allergies || []).join(', '),
        currentMedications: (user.currentMedications || []).join(', '),
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactPhone: user.emergencyContact?.phone || '',
        emergencyContactRelation: user.emergencyContact?.relation || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        currentMedications: form.currentMedications ? form.currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relation: form.emergencyContactRelation,
        }
      };
      const { data } = await userAPI.updateProfile(payload);
      updateUser(data.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const Field = ({ label, icon: Icon, children }) => (
    <div>
      <label className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-400 text-sm">Manage your health information</p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className={editing ? 'btn-primary flex items-center gap-2' : 'btn-ghost flex items-center gap-2'}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : editing ? (
            <><Save className="w-4 h-4" /> Save</>
          ) : (
            <><Edit3 className="w-4 h-4" /> Edit</>
          )}
        </button>
      </div>

      {/* Avatar section */}
      <div className="card flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-display font-bold text-3xl shadow-lg shadow-primary-500/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge text-xs ${user?.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            {user?.bloodGroup && (
              <span className="badge badge-emergency text-xs">{user.bloodGroup}</span>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card space-y-5">
        <h3 className="font-display font-bold text-white">Basic Information</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full Name" icon={User}>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              disabled={!editing}
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              disabled={!editing}
              placeholder="Your phone number"
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
          <Field label="Date of Birth" icon={Calendar}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
              disabled={!editing}
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
          <Field label="Gender" icon={User}>
            <select
              value={form.gender}
              onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              disabled={!editing}
              className="input-field disabled:opacity-50 disabled:cursor-default"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Medical Info */}
      <div className="card space-y-5">
        <h3 className="font-display font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-danger-400" /> Medical Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Blood Group" icon={Heart}>
            <select
              value={form.bloodGroup}
              onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}
              disabled={!editing}
              className="input-field disabled:opacity-50 disabled:cursor-default"
            >
              <option value="">Select blood group</option>
              {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Allergies (comma-separated)" icon={Shield}>
          <input
            value={form.allergies}
            onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
            disabled={!editing}
            placeholder="Penicillin, Pollen, Dust..."
            className="input-field disabled:opacity-50 disabled:cursor-default"
          />
        </Field>
        <Field label="Current Medications (comma-separated)" icon={Shield}>
          <input
            value={form.currentMedications}
            onChange={e => setForm(p => ({ ...p, currentMedications: e.target.value }))}
            disabled={!editing}
            placeholder="Metformin, Aspirin..."
            className="input-field disabled:opacity-50 disabled:cursor-default"
          />
        </Field>
      </div>

      {/* Emergency Contact */}
      <div className="card space-y-5">
        <h3 className="font-display font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" /> Emergency Contact
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Contact Name" icon={User}>
            <input
              value={form.emergencyContactName}
              onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))}
              disabled={!editing}
              placeholder="Contact person name"
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
          <Field label="Contact Phone" icon={Phone}>
            <input
              value={form.emergencyContactPhone}
              onChange={e => setForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
              disabled={!editing}
              placeholder="+91 9876543210"
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
          <Field label="Relationship" icon={User}>
            <input
              value={form.emergencyContactRelation}
              onChange={e => setForm(p => ({ ...p, emergencyContactRelation: e.target.value }))}
              disabled={!editing}
              placeholder="Spouse, Parent, Sibling..."
              className="input-field disabled:opacity-50 disabled:cursor-default"
            />
          </Field>
        </div>
      </div>

      {editing && (
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      )}
    </div>
  );
}
