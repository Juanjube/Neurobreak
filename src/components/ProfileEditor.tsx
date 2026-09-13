import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';

interface ProfileEditorProps {
  user: User;
  onBack: () => void;
  onSave: (name: string, email: string, avatar?: string) => Promise<{ emailChangeRequested: boolean; emailUpdated: boolean }>;
  onUploadPhoto: (file: File) => Promise<string>;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onBack, onSave, onUploadPhoto }) => {
  const [form, setForm] = useState({ name: user.name, email: user.email, avatar: user.avatar });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSpanish = user.language === 'es';
  const copy = (es: string, en: string) => isSpanish ? es : en;

  useEffect(() => {
    setForm({ name: user.name, email: user.email, avatar: user.avatar });
    if (!selectedPhoto) setPreview(user.avatar);
  }, [user.avatar, user.email, user.name, selectedPhoto]);

  useEffect(() => () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(copy('Selecciona una imagen JPG, PNG o WEBP.', 'Choose a JPG, PNG, or WEBP image.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(copy('La imagen no puede superar 5 MB.', 'The image cannot exceed 5 MB.'));
      return;
    }
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setSelectedPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setNotice(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const uploadedAvatar = selectedPhoto ? await onUploadPhoto(selectedPhoto) : undefined;
      const result = await onSave(form.name, form.email, uploadedAvatar);
      if (uploadedAvatar) setForm((current) => ({ ...current, avatar: uploadedAvatar }));
      setSelectedPhoto(null);
      if (uploadedAvatar) setPreview(uploadedAvatar);
      setNotice(result.emailChangeRequested && !result.emailUpdated
        ? copy('Perfil guardado. Confirma el cambio de correo desde tu bandeja de entrada.', 'Profile saved. Confirm the email change from your inbox.')
        : copy('Perfil actualizado y sincronizado.', 'Profile updated and synchronized.'));
    } catch (err: any) {
      setError(err?.message || copy('No se pudo actualizar el perfil.', 'Could not update the profile.'));
    } finally {
      setSaving(false);
    }
  };

  const cancelPhoto = () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setSelectedPhoto(null);
    setPreview(form.avatar);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasChanges = Boolean(selectedPhoto) || form.name !== user.name || form.email !== user.email;
  const fieldClass = 'h-12 w-full rounded-xl border border-border bg-[#120e1d] py-2 pl-10 pr-3 text-sm font-medium text-content outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary dark:bg-[#120e1d]';

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-primary"><span className="material-symbols-outlined text-lg">arrow_back</span>{copy('Volver al perfil', 'Back to profile')}</button>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/10">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-6 py-7 md:px-8"><div className="absolute -right-12 -top-14 size-48 rounded-full bg-primary/15 blur-3xl" /><div className="relative"><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"><span className="material-symbols-outlined text-base">edit</span>{copy('Edición de perfil', 'Profile editing')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-content">{copy('Tu información personal', 'Your personal information')}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{copy('Actualiza tu imagen, nombre o correo. Los cambios se sincronizan con tu cuenta.', 'Update your image, name, or email. Changes sync to your account.')}</p></div></div>

        <form onSubmit={save} className="p-6 md:p-8">
          {(notice || error) && <div className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-accent-teal/30 bg-accent-teal/10 text-accent-teal'}`}><span className="flex gap-2"><span className="material-symbols-outlined text-base">{error ? 'error' : 'check_circle'}</span>{error || notice}</span><button type="button" onClick={() => { setNotice(null); setError(null); }} className="text-current opacity-70 hover:opacity-100">×</button></div>}

          <section className="rounded-2xl border border-border/80 bg-background/40 p-4 sm:p-5"><div className="flex flex-col items-center gap-5 sm:flex-row"><div className="relative shrink-0"><div className="size-24 overflow-hidden rounded-full border-2 border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"><img src={preview || '/Logo.jpg'} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.src = '/Logo.jpg'; }} /></div><span className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border border-primary/60 bg-surface text-primary"><span className="material-symbols-outlined text-base">photo_camera</span></span></div><div className="min-w-0 flex-1 text-center sm:text-left"><h2 className="text-lg font-black text-content">{copy('Foto de perfil', 'Profile photo')}</h2><p className="mt-1 text-sm text-muted">{selectedPhoto?.name || copy('JPG, PNG o WEBP · máximo 5 MB', 'JPG, PNG, or WEBP · 5 MB maximum')}</p><div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start"><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="hidden" /><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-content"><span className="material-symbols-outlined text-lg">upload</span>{copy('Subir desde el equipo', 'Upload from device')}</button>{selectedPhoto && <button type="button" onClick={cancelPhoto} className="h-10 rounded-xl px-3 text-sm font-bold text-muted hover:bg-white/5 hover:text-content">{copy('Cancelar', 'Cancel')}</button>}</div></div></div></section>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted">{copy('Nombre visible', 'Display name')}</span><span className="relative block"><span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-primary">person</span><input value={form.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setError(null); }} autoComplete="name" maxLength={80} className={fieldClass} /></span></label><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted">{copy('Correo electrónico', 'Email address')}</span><span className="relative block"><span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-primary">mail</span><input type="email" value={form.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setError(null); }} autoComplete="email" maxLength={254} className={fieldClass} /></span></label></div>

          <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex max-w-md items-start gap-2 text-xs leading-relaxed text-muted"><span className="material-symbols-outlined mt-0.5 text-base text-primary">info</span>{copy('El correo puede requerir confirmación antes de quedar activo.', 'An email change may require confirmation before becoming active.')}</p><button type="submit" disabled={saving || !hasChanges} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-content shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><span className="material-symbols-outlined text-lg">save</span>{saving ? copy('Guardando...', 'Saving...') : copy('Guardar perfil', 'Save profile')}</button></div>
        </form>
      </section>
    </div>
  );
};

export default ProfileEditor;
