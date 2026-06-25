import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../../../src/store/useAuthStore';

export function useProfileData() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!token,
  });

  const profile = queryData?.user;
  const latestResume = profile?.resumes && profile.resumes.length > 0 ? profile.resumes[profile.resumes.length - 1] : null;
  const parsedData = latestResume?.parsedData || {};

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resumes/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to upload resume. Please try again.');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ sectionKey, newValue }: { sectionKey: string, newValue: any }) => {
      if (!latestResume) throw new Error('No active resume');
      
      const updatedParsedData = {
        ...latestResume.parsedData,
        [sectionKey]: newValue
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resumes/${latestResume.id}/parsed-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ parsedData: updatedParsedData })
      });

      if (!res.ok) throw new Error('Failed to save changes');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  return {
    profile,
    latestResume,
    parsedData,
    isLoading,
    uploadMutation,
    saveMutation
  };
}
