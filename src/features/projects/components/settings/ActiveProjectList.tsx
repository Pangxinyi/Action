import { Folder } from 'lucide-react-native';
import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '../../../../components/EmptyState';
import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { CategoryMap, Project } from '../../../../types';
import { ProjectEditItem, type EditingProject } from './ProjectEditItem';
import { ProjectViewItem } from './ProjectViewItem';

type Props = {
  projects: Project[];
  categories: CategoryMap;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  onArchive: (projectId: number) => void;
  colors: AppThemeColors;
};

export const ActiveProjectList: React.FC<Props> = ({ projects, categories, setProjects, onArchive, colors }) => {
  const { t } = useTranslation();
  const [editingProject, setEditingProject] = useState<EditingProject | null>(null);

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const handleEdit = (project: Project) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      category: project.category,
      hexColor: project.hexColor,
      percent: project.percent,
    });
  };

  const handleAddNew = () => {
    const newProj: EditingProject = {
      id: Date.now(),
      name: '',
      category: null,
      hexColor: '#9CA3AF',
      percent: 100,
    };
    setEditingProject(newProj);
  };

  const handleSave = (updated: EditingProject) => {
    setProjects((prev) => {
      const exists = prev.find((p) => p.id === updated.id);
      if (exists) {
        return prev.map((p) =>
          p.id === updated.id
            ? {
                ...p,
                name: updated.name,
                category: updated.category,
                hexColor: updated.hexColor,
                percent: updated.percent,
              }
            : p,
        );
      }

      // When creating a new project, if no category was selected (null/undefined),
      // treat it as explicit 'uncategorized' on save.
      const finalCategory = updated.category ?? 'uncategorized';
      const finalHex = updated.hexColor || categories[finalCategory] || '#9CA3AF';

      const newProject: Project = {
        id: updated.id,
        name: updated.name,
        category: finalCategory,
        hexColor: finalHex,
        percent: updated.percent,
        time: '0h 0m',
        x: 150,
        y: 150,
        vx: 0,
        vy: 0,
      };
      return [...prev, newProject];
    });
    setEditingProject(null);
  };

  return (
    <View style={{ gap: 8 }}>
      {activeProjects.length === 0 && !editingProject ? (
        <EmptyState
          message={t('projects.noActiveProjects')}
          icon={<Folder size={20} color={colors.textTertiary} />}
          fullScreen={false}
          style={{ paddingVertical: 16 }}
          actionButton={(
            <Pressable
              onPress={handleAddNew}
              style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: colors.accentText, fontWeight: '700' }}>{t('projects.addProject', { defaultValue: 'Add Project' })}</Text>
            </Pressable>
          )}
          colors={colors}
        />
      ) : (
        activeProjects.map((project) => (
          editingProject?.id === project.id ? (
            <ProjectEditItem
              key={project.id}
              editingProject={editingProject}
              setEditingProject={setEditingProject}
              categories={categories}
              colors={colors}
              onSave={handleSave}
              onCancel={() => setEditingProject(null)}
            />
          ) : (
            <ProjectViewItem
              key={project.id}
              project={project}
              colors={colors}
              onEdit={handleEdit}
              onArchive={onArchive}
            />
          )
        ))
      )}

      {editingProject && !activeProjects.some((p) => p.id === editingProject.id) && (
        <ProjectEditItem
          key={editingProject.id}
          editingProject={editingProject}
          setEditingProject={setEditingProject}
          categories={categories}
          colors={colors}
          onSave={handleSave}
          onCancel={() => setEditingProject(null)}
        />
      )}

      {!editingProject && activeProjects.length > 0 && (
        <Pressable
          onPress={handleAddNew}
          style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
        >
          <Text style={{ color: colors.accentText, fontWeight: '700' }}>{t('projects.addProject', { defaultValue: 'Add Project' })}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default ActiveProjectList;
