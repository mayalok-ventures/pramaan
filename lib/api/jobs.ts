import { apiClient } from '../api-client';

export interface JobsParams {
  search?: string;
  location?: string;
  remote?: boolean;
  skills?: string[];
  sortBy?: 'newest' | 'trustScore' | 'salary';
  limit?: number;
  offset?: number;
}

export interface JobApplication {
  coverLetter?: string;
  resumeUrl?: string;
}

export async function getJob(id: string) {
  return apiClient.get(`/jobs/${id}`);
}

export async function getJobs(params?: JobsParams) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }
  const query = searchParams.toString();
  return apiClient.get(`/jobs${query ? `?${query}` : ''}`);
}

export async function applyToJob(id: string, data: JobApplication) {
  return apiClient.post(`/jobs/${id}/apply`, data);
}
