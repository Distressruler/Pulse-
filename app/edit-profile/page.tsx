"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-pink-100 ${className}`}
    />
  );
}

function NavigationSkeleton() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <SkeletonBlock className="h-5 w-24" />
      </div>

      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

function FormFieldSkeleton({
  includeHelper = false,
  large = false,
}: {
  includeHelper?: boolean;
  large?: boolean;
}) {
  return (
    <div>
      <SkeletonBlock className="mb-2 h-4 w-24" />

      <SkeletonBlock
        className={
          large
            ? "h-32 w-full rounded-2xl"
            : "h-13 w-full rounded-2xl"
        }
      />

      {includeHelper && (
        <SkeletonBlock className="mt-2 h-3 w-44" />
      )}
    </div>
  );
}

function EditProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <NavigationSkeleton />

        <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
          <SkeletonBlock className="h-24 w-full rounded-none" />

          <div className="p-5 sm:p-8">
            <div className="mb-7 flex items-center gap-2">
              <SkeletonBlock className="h-4 w-4 rounded-full" />
              <SkeletonBlock className="h-4 w-28" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative w-fit">
                <div className="rounded-full border-4 border-white bg-white shadow-md">
                  <SkeletonBlock className="h-28 w-28 rounded-full" />
                </div>

                <SkeletonBlock className="absolute bottom-0 right-0 h-10 w-10 rounded-full border-4 border-white" />
              </div>

              <div className="flex-1">
                <SkeletonBlock className="h-7 w-40 sm:h-8" />
                <SkeletonBlock className="mt-3 h-4 w-56" />

                <div className="mt-4 flex flex-wrap gap-2">
                  <SkeletonBlock className="h-9 w-36 rounded-full" />
                  <SkeletonBlock className="h-9 w-24 rounded-full" />
                </div>

                <SkeletonBlock className="mt-3 h-3 w-52" />
              </div>
            </div>

            <div className="mt-9 space-y-6">
              <FormFieldSkeleton includeHelper />
              <FormFieldSkeleton />
              <FormFieldSkeleton large />

              <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-6 sm:flex-row sm:justify-end">
                <SkeletonBlock className="h-11 w-full rounded-full sm:w-24" />
                <SkeletonBlock className="h-11 w-full rounded-full sm:w-36" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function EditProfilePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [currentAvatarUrl, setCurrentAvatarUrl] =
    useState("");

  const [selectedAvatar, setSelectedAvatar] =
    useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] =
    useState("");

  const [removeAvatar, setRemoveAvatar] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setPageLoading(true);
        setMessage("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          router.refresh();
          return;
        }

        setCurrentUserId(user.id);

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "username, display_name, bio, avatar_url"
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }

        setUsername(
          profile.username ?? ""
        );

        setDisplayName(
          profile.display_name ?? ""
        );

        setBio(profile.bio ?? "");

        const loadedAvatar =
          profile.avatar_url ?? "";

        setCurrentAvatarUrl(
          loadedAvatar
        );

        setAvatarPreview(loadedAvatar);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your profile."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview &&
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAvatarSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");

    if (
      !file.type.startsWith("image/")
    ) {
      setMessage(
        "Please choose a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size > MAX_AVATAR_SIZE
    ) {
      setMessage(
        "Profile picture must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedAvatar(file);
    setAvatarPreview(previewUrl);
    setRemoveAvatar(false);
  }

  function handleRemoveAvatar() {
    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setSelectedAvatar(null);
    setAvatarPreview("");
    setRemoveAvatar(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadAvatar(
    userId: string,
    file: File
  ) {
    const fileExtension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${userId}/avatar-${Date.now()}.${fileExtension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async function deletePreviousAvatar(
    avatarUrl: string
  ) {
    if (!avatarUrl) {
      return;
    }

    const pathMarker =
      `/storage/v1/object/public/${AVATAR_BUCKET}/`;

    const markerPosition =
      avatarUrl.indexOf(pathMarker);

    if (markerPosition === -1) {
      return;
    }

    const encodedPath =
      avatarUrl.slice(
        markerPosition +
          pathMarker.length
      );

    const storagePath =
      decodeURIComponent(
        encodedPath
      );

    const { error } =
      await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([storagePath]);

    if (error) {
      console.error(
        "Could not remove old avatar:",
        error.message
      );
    }
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !currentUserId ||
      saving
    ) {
      return;
    }

    const cleanedUsername =
      username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(
          /[^a-z0-9_]/g,
          ""
        );

    if (!cleanedUsername) {
      setMessage(
        "Please enter a valid username."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      let nextAvatarUrl =
        removeAvatar
          ? null
          : currentAvatarUrl ||
            null;

      if (selectedAvatar) {
        const uploadedAvatarUrl =
          await uploadAvatar(
            currentUserId,
            selectedAvatar
          );

        nextAvatarUrl =
          uploadedAvatarUrl;
      }

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          username:
            cleanedUsername,
          display_name:
            displayName.trim() ||
            null,
          bio:
            bio.trim() || null,
          avatar_url:
            nextAvatarUrl,
        })
        .eq(
          "id",
          currentUserId
        );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      if (
        currentAvatarUrl &&
        (selectedAvatar ||
          removeAvatar)
      ) {
        await deletePreviousAvatar(
          currentAvatarUrl
        );
      }

      router.push(
        `/profile/${currentUserId}`
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <EditProfilePageSkeleton />
    );
  }

  const previewName =
    displayName.trim() ||
    username.trim() ||
    "Pulse user";

  const firstLetter =
    previewName
      .charAt(0)
      .toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AppNav
          currentUserId={
            currentUserId
          }
        />

        <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-pink-200 via-rose-100 to-pink-100" />

          <div className="p-5 sm:p-8">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push(
                  `/profile/${currentUserId}`
                )
              }
              className="mb-7 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft
                size={17}
              />

              Back to profile
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative w-fit">
                <div className="rounded-full border-4 border-white bg-white shadow-md">
                  {avatarPreview ? (
                    <img
                      src={
                        avatarPreview
                      }
                      alt={previewName}
                      className="h-28 w-28 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-pink-100 text-3xl font-bold text-pink-500">
                      {firstLetter || (
                        <UserRound
                          size={34}
                        />
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    openFilePicker
                  }
                  aria-label="Choose profile picture"
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-pink-500 text-white shadow-sm transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera
                    size={17}
                  />
                </button>
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Edit Profile
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Update how your
                  Pulse profile
                  appears.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={
                      openFilePicker
                    }
                    className="flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImagePlus
                      size={16}
                    />

                    {avatarPreview
                      ? "Change picture"
                      : "Upload picture"}
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={
                        handleRemoveAvatar
                      }
                      className="flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2
                        size={16}
                      />

                      Remove
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  JPG, PNG, WEBP
                  or GIF. Maximum
                  size 5 MB.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={
                handleAvatarSelection
              }
              className="hidden"
            />

            <form
              onSubmit={
                handleSave
              }
              className="mt-9 space-y-6"
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Username
                </label>

                <div className="flex rounded-2xl border border-pink-100 bg-pink-50 transition focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-100">
                  <span className="flex items-center pl-4 text-gray-400">
                    @
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    required
                    maxLength={30}
                    disabled={saving}
                    onChange={(
                      event
                    ) =>
                      setUsername(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="your_username"
                    className="w-full bg-transparent px-2 py-3.5 text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Letters, numbers
                  and underscores
                  only.
                </p>
              </div>

              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Display name
                </label>

                <input
                  id="displayName"
                  type="text"
                  value={
                    displayName
                  }
                  maxLength={60}
                  disabled={saving}
                  onChange={(
                    event
                  ) =>
                    setDisplayName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Bio
                </label>

                <textarea
                  id="bio"
                  rows={5}
                  value={bio}
                  maxLength={300}
                  disabled={saving}
                  onChange={(
                    event
                  ) =>
                    setBio(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Tell people something about yourself..."
                  className="w-full resize-none rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-right text-xs text-gray-400">
                  {bio.length}/300
                </p>
              </div>

              {message && (
                <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {message}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    router.push(
                      `/profile/${currentUserId}`
                    )
                  }
                  className="rounded-full border border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}