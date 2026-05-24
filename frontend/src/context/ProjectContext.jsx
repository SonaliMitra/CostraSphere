import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
      return res.data;
    } catch {
      return [];
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const res = await api.get('/auth/companies');
      setCompanies(res.data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    loadProjects();
    loadCompanies();
  }, [loadProjects, loadCompanies]);

  const selectProject = (p) => {
    if (!p) return setPlan(null);
    setPlan({
      project_id: p.id,
      towers: p.towers_data,
      routes: p.routes_data,
      costs: p.cost_breakdown,
      location: { city: p.city, state: p.state },
      hub: { latitude: p.latitude, longitude: p.longitude },
      approval_status: p.approval_status,
      workers_needed: p.workers_needed,
      deployment_days: p.deployment_days,
      selected_company: p.selected_company,
      max_tower_distance_km: p.max_tower_distance_km,
      name: p.name,
    });
  };

  const generatePlan = async (params) => {
    setLoading(true);
    try {
      const res = await api.post('/telecom/generate', params);
      setPlan(res.data);
      await loadProjects();
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{
      plan, setPlan, projects, companies, loading,
      loadProjects, loadCompanies, selectProject, generatePlan,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
