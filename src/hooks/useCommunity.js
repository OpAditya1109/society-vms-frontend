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

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => communityService.createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      Toast.show({ type: 'success', text1: 'Post Published!', text2: 'Your post is now visible to society members.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed to post', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

export function useUpdatePost(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => communityService.updatePost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
      Toast.show({ type: 'success', text1: 'Post Updated.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => communityService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      Toast.show({ type: 'success', text1: 'Post deleted.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

export function useToggleLike(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityService.toggleLike(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

export function useAddComment(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text) => communityService.addComment(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(id) });
      Toast.show({ type: 'success', text1: 'Comment added.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed to comment', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

export function useDeleteComment(postId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => communityService.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.detail(postId) });
      Toast.show({ type: 'success', text1: 'Comment deleted.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}