'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface ProfileData {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  skills?: string[];
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave?: (data: ProfileData) => void;
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: ProfileData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      bio: formData.get('bio') as string,
      location: formData.get('location') as string,
      skills: (formData.get('skills') as string)?.split(',').map((s) => s.trim()).filter(Boolean),
    };
    onSave?.(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              defaultValue={profile.name}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={profile.email}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio}
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium">Location</label>
            <input
              id="location"
              name="location"
              defaultValue={profile.location}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="skills" className="block text-sm font-medium">Skills (comma-separated)</label>
            <input
              id="skills"
              name="skills"
              defaultValue={profile.skills?.join(', ')}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Save
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
