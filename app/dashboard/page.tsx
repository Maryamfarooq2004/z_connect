"use client";

import { apiClient } from "@/lib/axios";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  UserPlus, 
  Trash2, 
  Upload, 
  File, 
  Image as ImageIcon,
  CheckCircle,
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { PrimaryButton } from "@/components/ui/Buttons";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Administrator" | "Coordinator" | "Editor";
  status: "Active" | "Pending";
}

interface MediaFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Dashboard Section states
  const [activeSection, setActiveSection] = useState<"directory" | "profile" | "media">("directory");
  
  // Managers Directory states
  const [managers, setManagers] = useState<Manager[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: "", lastName: "", email: "", role: "Editor" as const });
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  
  // Media states
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Self Profile states
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    avatar: "",
  });

  // Sync profileForm when user context resolves
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        username: user.username || "",
        avatar: user.imageUrl || "",
      });

      // Fetch profile from database to load the custom ImageKit avatar
      apiClient.get("/api/user/me")
        .then((res) => {
          setProfileForm(prev => ({
            ...prev,
            fullName: res.data.fullName || prev.fullName,
            username: res.data.username || prev.username,
            avatar: res.data.avatarUrl || prev.avatar,
          }));
        })
        .catch((err) => console.error("Error fetching database profile:", err));
    }
  }, [user]);

  // Fetch directory and media data
  useEffect(() => {
    async function loadData() {
      try {
        if (activeSection === "directory") {
          const res = await apiClient.get("/api/user/managers");
          const mapped = res.data.map((m: any) => ({
            id: m.id,
            firstName: m.first_name,
            lastName: m.last_name,
            email: m.email,
            role: m.role === "manager" ? "Editor" : m.role || "Editor",
            status: m.status || "Active",
          }));
          setManagers(mapped);
        } else if (activeSection === "media") {
          const res = await apiClient.get("/api/aws/fetch-content");
          setMediaFiles(res.data);
        }
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        toast.error("Failed to load records from database.");
      }
    }
    loadData();
  }, [activeSection]);

  // Toggle Empty State for Managers Directory demonstration
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Actions
  const handleInviteManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email) {
      toast.error("Required fields missing.");
      return;
    }
    try {
      const res = await apiClient.post("/api/user/invite-manager", {
        first_name: inviteForm.firstName,
        last_name: inviteForm.lastName,
        email: inviteForm.email.toLowerCase(),
        password: "Password123!", // default stub password
      });
      const invited = res.data;
      const newManager: Manager = {
        id: invited.id,
        firstName: invited.first_name,
        lastName: invited.last_name,
        email: invited.email,
        role: invited.role || "Editor",
        status: invited.status || "Pending",
      };
      setManagers([newManager, ...managers]);
      setInviteForm({ firstName: "", lastName: "", email: "", role: "Editor" });
      setShowInviteModal(false);
      toast.success("Invitation dispatched", {
        description: `Dispatched an invite token to ${newManager.email}.`
      });
    } catch (err: any) {
      console.error("Invite manager error:", err);
      toast.error(err.response?.data?.error || "Failed to invite manager.");
    }
  };

  const handleRemoveManager = async (id: string) => {
    try {
      await apiClient.delete(`/api/user/${id}`);
      setManagers(managers.filter(m => m.id !== id));
      if (selectedManager?.id === id) {
        setSelectedManager(null);
      }
      toast.success("Manager removed", {
        description: "The manager's directory privileges have been revoked."
      });
    } catch (err: any) {
      console.error("Remove manager error:", err);
      toast.error("Failed to revoke manager privileges.");
    }
  };

  const handleUpdateManager = (updated: Manager) => {
    setManagers(managers.map(m => m.id === updated.id ? updated : m));
    setSelectedManager(null);
    toast.success("Directory record updated.");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file format. Please upload an image.");
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Limit is 5MB.");
        return;
      }

      setIsUploading(true);
      try {
        // Update Clerk's profile photo globally across all active sessions/devices
        if (user) {
          await user.setProfileImage({ file });
        }

        // Fetch signature from secure backend endpoint
        const authRes = await apiClient.get("/api/imagekit/auth");
        const { signature, token, expire } = authRes.data;

        // Construct upload payload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
        formData.append("signature", signature);
        formData.append("token", token);
        formData.append("expire", expire.toString());
        formData.append("folder", "/profile-pictures");

        // Upload directly to ImageKit
        const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);
        const imageUrl = uploadRes.data.url;

        // Register profile photo in local database
        await apiClient.post("/api/user/upload-image", { imageUrl });
        setProfileForm({ ...profileForm, avatar: imageUrl });
        toast.success("Profile photo registered successfully.");
      } catch (err) {
        console.error("Avatar upload error:", err);
        toast.error("Failed to upload profile photo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await apiClient.delete("/api/user/remove-image");
      setProfileForm({ ...profileForm, avatar: "" });
      toast.success("Profile photo removed.");
    } catch (err) {
      toast.error("Failed to remove profile photo.");
    }
  };

  const handleUpdateSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const parts = profileForm.fullName.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      await user.update({
        firstName,
        lastName,
        username: profileForm.username,
      });
      toast.success("Your profile record has been synchronized.");
    } catch (err: any) {
      console.error("Update profile error:", err);
      toast.error(err.message || "Failed to sync profile settings.");
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const fileName = file.name;
        const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        const fileType = file.type.includes("image") ? "image" : "pdf";
        const fileUrl = `https://s3.amazonaws.com/zconnect-bucket/${encodeURIComponent(file.name)}`;

        const res = await apiClient.post("/api/aws/upload", {
          fileName,
          fileSize,
          fileType,
          fileUrl,
        });

        setMediaFiles([res.data.file, ...mediaFiles]);
        toast.success("File registered in media archive.");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Failed to register media file.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await apiClient.delete(`/api/aws/file?id=${id}`);
      setMediaFiles(mediaFiles.filter(f => f.id !== id));
      toast.success("Media file archived.");
    } catch (err) {
      console.error("Delete media error:", err);
      toast.error("Failed to delete media file.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row text-text-primary paper-grain relative">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-subtle bg-bg-surface p-6 flex flex-col justify-between relative z-10">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-6 bg-accent-primary" />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">
              ZConnect
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection("directory")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === "directory" 
                  ? "bg-accent-primary text-bg-surface font-semibold" 
                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Managers</span>
            </button>
            <button
              onClick={() => setActiveSection("media")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === "media" 
                  ? "bg-accent-primary text-bg-surface font-semibold" 
                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Media Archive</span>
            </button>
            <button
              onClick={() => setActiveSection("profile")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === "profile" 
                  ? "bg-accent-primary text-bg-surface font-semibold" 
                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Profile Settings</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-border-subtle/50 space-y-4">
          <div className="flex items-center gap-3 px-2">
            {profileForm.avatar ? (
              <img src={profileForm.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover border border-border-subtle" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent-primary/10 flex items-center justify-center font-mono text-xs text-accent-primary">
                {profileForm.fullName.charAt(0)}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-semibold text-text-primary">{profileForm.fullName}</p>
              <p className="text-[10px] font-mono text-text-secondary/60">@{profileForm.username}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-accent-error hover:bg-accent-error/5 rounded transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-12 relative z-10 flex flex-col justify-between">
        
        {/* Top Header Row */}
        <header className="flex justify-between items-start border-b border-border-subtle/80 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-display font-light text-text-primary uppercase tracking-tight">
              {activeSection === "directory" ? "Workspace Directory" : activeSection === "media" ? "Media Vault" : "Settings"}
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/70 mt-1">
              Active Session Scope // ZCN.OP-{activeSection.toUpperCase()}
            </p>
          </div>

          {activeSection === "directory" && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEmptyState(!showEmptyState)}
                className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded border border-border-subtle text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                Simulate {showEmptyState ? "Populated" : "Empty"} State
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-editorial text-xs font-mono uppercase tracking-wider px-4 py-2 rounded flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Invite Manager</span>
              </button>
            </div>
          )}
        </header>

        {/* Section Rendering */}
        <div className="flex-1">
          {activeSection === "directory" && (
            <>
              {showEmptyState || managers.length === 0 ? (
                /* Editorial Empty State */
                (<div className="border border-dashed border-border-subtle rounded-xl p-12 text-center max-w-lg mx-auto my-12 bg-bg-surface/30">
                  <p className="text-lg font-display italic text-text-secondary mb-3">No managers listed in directory</p>
                  <p className="text-xs text-text-secondary/70 leading-relaxed max-w-sm mx-auto mb-6">
                    A directory record grants permission to upload resources, curate files, and handle user catalogs. Invite a administrator or editor to begin.
                  </p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-editorial text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </div>)
              ) : (
                /* Populated State & Detail View Panel */
                (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Manager list */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="border border-border-subtle bg-bg-surface rounded overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle/50 text-[10px] font-mono uppercase tracking-widest text-text-secondary/70 bg-bg-base/30">
                            <th className="p-4 font-normal">Manager</th>
                            <th className="p-4 font-normal">Privileges</th>
                            <th className="p-4 font-normal">State</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/40 text-sm">
                          {managers.map(mgr => (
                            <tr 
                              key={mgr.id} 
                              onClick={() => setSelectedManager(mgr)}
                              className={`hover:bg-bg-base/20 transition-all cursor-pointer ${
                                selectedManager?.id === mgr.id ? "bg-bg-base/40 font-medium" : ""
                              }`}
                            >
                              <td className="p-4">
                                <div>{mgr.firstName} {mgr.lastName}</div>
                                <div className="text-xs text-text-secondary/65 font-mono">{mgr.email}</div>
                              </td>
                              <td className="p-4 font-mono text-xs">{mgr.role}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase ${
                                  mgr.status === "Active" 
                                    ? "bg-accent-success/10 text-accent-success border border-accent-success/20" 
                                    : "bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20"
                                }`}>
                                  {mgr.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Right Column: Detailed Inspector Panel */}
                  <div className="border border-border-subtle bg-bg-surface rounded-xl p-6 relative">
                    {selectedManager ? (
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/60">Manager Profile</p>
                          <h3 className="text-2xl font-display font-light text-text-primary mt-1">
                            {selectedManager.firstName} {selectedManager.lastName}
                          </h3>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-text-secondary/70">Email Address</span>
                            <span className="text-text-primary font-mono">{selectedManager.email}</span>
                          </div>
                          <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-text-secondary/70">Privileges Scale</span>
                            <span className="text-text-primary">{selectedManager.role}</span>
                          </div>
                          <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-text-secondary/70">Record Status</span>
                            <span className="text-text-primary font-mono">{selectedManager.status}</span>
                          </div>
                        </div>

                        {/* Inline editor forms */}
                        <div className="pt-6 border-t border-border-subtle flex gap-3">
                          <button
                            onClick={() => handleRemoveManager(selectedManager.id)}
                            className="btn-secondary-outline text-[10px] font-mono uppercase tracking-wider py-2 px-3 rounded text-accent-error border-accent-error/20 hover:bg-accent-error/5 cursor-pointer flex-1"
                          >
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-xs italic text-text-secondary/60 font-mono">// Select a record to inspect details</p>
                      </div>
                    )}
                  </div>
                </div>)
              )}
            </>
          )}

          {activeSection === "media" && (
            <div className="space-y-8">
              {/* Upload section */}
              <div className="border border-dashed border-border-subtle rounded-xl p-8 bg-bg-surface/30 text-center max-w-2xl">
                <input
                  type="file"
                  id="media-upload-input"
                  onChange={handleMediaUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="media-upload-input"
                  className="flex flex-col items-center justify-center gap-3 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-105 transition-all">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Dispatch file to directory archive</p>
                    <p className="text-xs text-text-secondary/60 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </label>
                {isUploading && (
                  <p className="text-[10px] font-mono text-accent-primary uppercase tracking-widest mt-4 animate-pulse">
                    Archiving system file...
                  </p>
                )}
              </div>

              {/* Media Vault Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary/80">Archived Media Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaFiles.map(file => (
                    <div key={file.id} className="border border-border-subtle bg-bg-surface p-4 rounded-lg flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-bg-base rounded text-accent-primary mt-0.5">
                          {file.type === "pdf" ? <File className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-text-primary truncate max-w-[160px]">{file.name}</p>
                          <p className="text-[10px] font-mono text-text-secondary/60 uppercase mt-0.5">{file.size} // {file.uploadedAt}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMedia(file.id)}
                        className="text-text-secondary/40 hover:text-accent-error p-1 transition-colors cursor-pointer"
                        title="Delete File"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="max-w-xl">
              <form onSubmit={handleUpdateSelfProfile} className="space-y-6">
                
                {/* Profile Photo Uploader */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Profile Image</label>
                  <div className="flex items-center gap-5">
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover border border-border-subtle" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-accent-primary/10 flex items-center justify-center font-mono text-lg text-accent-primary">
                        {profileForm.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <input
                        type="file"
                        id="avatar-upload-input"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                      />
                      <label
                        htmlFor="avatar-upload-input"
                        className="btn-secondary-outline text-xs font-mono uppercase tracking-wider px-4 py-2 rounded cursor-pointer select-none"
                      >
                        Upload Photo
                      </label>
                      {profileForm.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-xs font-mono uppercase tracking-wider text-accent-error hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="flex h-12 w-full rounded bg-bg-surface border border-border-subtle px-4 py-3 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="flex h-12 w-full rounded bg-bg-surface border border-border-subtle px-4 py-3 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                  />
                </div>

                <PrimaryButton type="submit" className="max-w-[200px]">
                  Synchronize Profile
                </PrimaryButton>
              </form>
            </div>
          )}
        </div>
      </main>
      {/* Invite Manager Modal Container */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 max-w-md w-full shadow-lg relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 text-text-secondary/40 hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 mb-6">
              <h3 className="text-2xl font-display font-light text-text-primary">Invite Manager</h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary/70">Assign system privileges to new user</p>
            </div>

            <form onSubmit={handleInviteManager} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Klara"
                    value={inviteForm.firstName}
                    onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="flex h-11 w-full rounded bg-bg-base/40 border border-border-subtle px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Svensson"
                    value={inviteForm.lastName}
                    onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="flex h-11 w-full rounded bg-bg-base/40 border border-border-subtle px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. klara@organization.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="flex h-11 w-full rounded bg-bg-base/40 border border-border-subtle px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">Privilege Level</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="flex h-11 w-full rounded bg-bg-base/40 border border-border-subtle px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                >
                  <option value="Editor">Editor (curate content)</option>
                  <option value="Coordinator">Coordinator (team logistics)</option>
                  <option value="Administrator">Administrator (full catalog control)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary-outline text-xs font-mono uppercase tracking-wider py-2.5 px-4 rounded flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" className="flex-1">
                  Send Invitation
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
