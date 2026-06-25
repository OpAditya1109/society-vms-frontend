// src/hooks/useCommunity.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { communityService } from '../api/services/communityService';

export const COMMUNITY_KEYS = {
  all:    ['community'],
  list:   (params) => ['community', 'list', params],
  my:     ['community', 'my'],
  detail: (id) => ['community', id],
};

export function useCommunityPosts(params) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.list(params),
    queryFn:  () => communityService.getPosts(params),
  });
}

export function useMyPosts() {
  return useQuery({
    queryKey: COMMUNITY_KEYS.my,
    queryFn:  () => communityService.getMyPosts(),
  });
}

export function useCommunityPost(id) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.detail(id),
    queryFn:  () => communityService.getPostById(id),
    enabled:  !!id,
  });
}

/**
 * ✅ IMPROVED: useCreatePost with better error handling
 * Handles validation errors from backend and displays them clearly
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      // Log the payload for debugging
      console.log('[useCreatePost] Sending payload:', payload);
      return communityService.createPost(payload);
    },
    onSuccess: (data) => {
      console.log('[useCreatePost] ✅ Success:', data);
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      Toast.show({
        type: 'success',
        text1: 'Post Published!',
        text2: 'Your post is now visible to society members.',
        duration: 3000,
      });
    },
    onError: (err) => {
      console.error('[useCreatePost] ❌ Error:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });

      // Extract error details
      const backendMessage = err?.response?.data?.message;
      const backendErrors = err?.response?.data?.errors;

      // Build error message
      let errorMessage = 'Please try again.';
      let errorDetails = '';

      if (backendErrors && Array.isArray(backendErrors)) {
        // Handle validation errors array
        console.log('[useCreatePost] Validation errors:', backendErrors);
        errorDetails = backendErrors
          .map((e) => `${e.field}: ${e.message}`)
          .join('\n');
        errorMessage = 'Validation failed. Please check your input.';
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }

      Toast.show({
        type: 'error',
        text1: 'Failed to post',
        text2: errorDetails || errorMessage,
        duration: 4000,
      });
    },
  });
}

export function useUpdatePost(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      console.log('[useUpdatePost] Updating post:', id, payload);
      return communityService.updatePost(id, payload);
    },
    onSuccess: () => {
      console.log('[useUpdatePost] ✅ Success');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
      Toast.show({
        type: 'success',
        text1: 'Post Updated.',
        duration: 2000,
      });
    },
    onError: (err) => {
      console.error('[useUpdatePost] ❌ Error:', err?.response?.data);
      const errorMessage = err?.response?.data?.message ?? 'Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: errorMessage,
        duration: 3000,
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => {
      console.log('[useDeletePost] Deleting post:', id);
      return communityService.deletePost(id);
    },
    onSuccess: () => {
      console.log('[useDeletePost] ✅ Success');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      Toast.show({
        type: 'success',
        text1: 'Post deleted.',
        duration: 2000,
      });
    },
    onError: (err) => {
      console.error('[useDeletePost] ❌ Error:', err?.response?.data);
      const errorMessage = err?.response?.data?.message ?? 'Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: errorMessage,
        duration: 3000,
      });
    },
  });
}

export function useToggleLike(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      console.log('[useToggleLike] Toggling like for post:', id);
      return communityService.toggleLike(id);
    },
    onSuccess: () => {
      console.log('[useToggleLike] ✅ Success');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      if (id) {
        queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
      }
    },
    onError: (err) => {
      console.error('[useToggleLike] ❌ Error:', err?.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: err?.response?.data?.message ?? 'Please try again.',
        duration: 2000,
      });
    },
  });
}

export function useAddComment(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text) => {
      console.log('[useAddComment] Adding comment to post:', id);
      return communityService.addComment(id, text);
    },
    onSuccess: () => {
      console.log('[useAddComment] ✅ Success');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
      Toast.show({
        type: 'success',
        text1: 'Comment added.',
        duration: 2000,
      });
    },
    onError: (err) => {
      console.error('[useAddComment] ❌ Error:', err?.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Failed to comment',
        text2: err?.response?.data?.message ?? 'Please try again.',
        duration: 3000,
      });
    },
  });
}

export function useDeleteComment(postId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => {
      console.log('[useDeleteComment] Deleting comment:', commentId, 'from post:', postId);
      return communityService.deleteComment(postId, commentId);
    },
    onSuccess: () => {
      console.log('[useDeleteComment] ✅ Success');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(postId) });
      Toast.show({
        type: 'success',
        text1: 'Comment deleted.',
        duration: 2000,
      });
    },
    onError: (err) => {
      console.error('[useDeleteComment] ❌ Error:', err?.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: err?.response?.data?.message ?? 'Please try again.',
        duration: 3000,
      });
    },
  });
}