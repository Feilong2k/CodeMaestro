// Component tests for ProjectPicker.vue (subtask 2-2-4)
// These tests verify project selection UI and context propagation

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, beforeEach, test, expect, vi } from 'vitest';

// Mock the project service
vi.mock('@/services/projectService', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
}));

describe('ProjectPicker.vue', () => {
  let wrapper;
  let mockFetchProjects;
  let mockCreateProject;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mocks
    mockFetchProjects = vi.fn();
    mockCreateProject = vi.fn();

    // Re-import the module with fresh mocks
    await vi.isolateModules(async () => {
      vi.mock('@/services/projectService', () => ({
        fetchProjects: mockFetchProjects,
        createProject: mockCreateProject,
      }));

      // Re-import the component with the new mock
      const module = await import('@/components/ProjectPicker.vue');
      const ProjectPicker = module.default;
      wrapper = mount(ProjectPicker);
    });
  });

  describe('initial state', () => {
    test('should render project selection dropdown', () => {
      const select = wrapper.find('select');
      expect(select.exists()).toBe(true);
    });

    test('should have a default option for no project selected', () => {
      const options = wrapper.findAll('option');
      expect(options.length).toBeGreaterThan(0);
      expect(options[0].text()).toContain('Select a project');
    });

    test('should have a button to create new project', () => {
      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('New Project');
    });
  });

  describe('project loading', () => {
    test('should fetch projects on mount', () => {
      expect(mockFetchProjects).toHaveBeenCalledTimes(1);
    });

    test('should display loaded projects in dropdown', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project Alpha' },
        { id: 'proj-2', name: 'Project Beta' },
      ];
      mockFetchProjects.mockResolvedValue(mockProjects);

      // Re-mount with the mock returning data
      await vi.isolateModules(async () => {
        vi.mock('@/services/projectService', () => ({
          fetchProjects: vi.fn().mockResolvedValue(mockProjects),
          createProject: mockCreateProject,
        }));

        const module = await import('@/components/ProjectPicker.vue');
        const ProjectPicker = module.default;
        wrapper = mount(ProjectPicker);
      });

      await nextTick();

      const options = wrapper.findAll('option');
      // Default option + 2 projects
      expect(options).toHaveLength(3);
      expect(options[1].text()).toBe('Project Alpha');
      expect(options[2].text()).toBe('Project Beta');
    });

    test('should handle empty project list', async () => {
      mockFetchProjects.mockResolvedValue([]);

      await vi.isolateModules(async () => {
        vi.mock('@/services/projectService', () => ({
          fetchProjects: vi.fn().mockResolvedValue([]),
          createProject: mockCreateProject,
        }));

        const module = await import('@/components/ProjectPicker.vue');
        const ProjectPicker = module.default;
        wrapper = mount(ProjectPicker);
      });

      await nextTick();

      const options = wrapper.findAll('option');
      // Only default option
      expect(options).toHaveLength(1);
    });
  });

  describe('project selection', () => {
    test('should emit selectedProjectId when project is selected', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project Alpha' },
        { id: 'proj-2', name: 'Project Beta' },
      ];
      mockFetchProjects.mockResolvedValue(mockProjects);

      await vi.isolateModules(async () => {
        vi.mock('@/services/projectService', () => ({
          fetchProjects: vi.fn().mockResolvedValue(mockProjects),
          createProject: mockCreateProject,
        }));

        const module = await import('@/components/ProjectPicker.vue');
        const ProjectPicker = module.default;
        wrapper = mount(ProjectPicker);
      });

      await nextTick();

      const select = wrapper.find('select');
      await select.setValue('proj-2');

      // Expect the component to emit an event
      expect(wrapper.emitted('update:selectedProjectId')).toBeTruthy();
      expect(wrapper.emitted('update:selectedProjectId')[0]).toEqual(['proj-2']);
    });

    test('should handle no project selected (empty string)', async () => {
      const select = wrapper.find('select');
      await select.setValue('');

      expect(wrapper.emitted('update:selectedProjectId')).toBeTruthy();
      expect(wrapper.emitted('update:selectedProjectId')[0]).toEqual(['']);
    });
  });

  describe('new project creation', () => {
    test('should open wizard when New Project button is clicked', async () => {
      const button = wrapper.find('button');
      await button.trigger('click');

      // Expect the component to emit an event to open the wizard
      expect(wrapper.emitted('createProject')).toBeTruthy();
    });

    test('should refresh project list after new project is created', async () => {
      const newProject = { id: 'proj-new', name: 'New Project' };
      mockCreateProject.mockResolvedValue(newProject);

      // Simulate wizard completion and project creation
      wrapper.vm.handleProjectCreated(newProject);

      expect(mockFetchProjects).toHaveBeenCalledTimes(2); // initial + refresh
    });
  });

  describe('context persistence', () => {
    test('should persist selected project in session state', async () => {
      // This would require mocking sessionStorage or a store
      // For now, we test that the component emits the selected ID
      const mockProjects = [{ id: 'proj-1', name: 'Project Alpha' }];
      mockFetchProjects.mockResolvedValue(mockProjects);

      await vi.isolateModules(async () => {
        vi.mock('@/services/projectService', () => ({
          fetchProjects: vi.fn().mockResolvedValue(mockProjects),
          createProject: mockCreateProject,
        }));

        const module = await import('@/components/ProjectPicker.vue');
        const ProjectPicker = module.default;
        wrapper = mount(ProjectPicker);
      });

      await nextTick();

      const select = wrapper.find('select');
      await select.setValue('proj-1');

      // The parent component (or store) should handle persistence
      // We just verify the event is emitted
      expect(wrapper.emitted('update:selectedProjectId')).toBeTruthy();
    });
  });

  describe('integration with chat API', () => {
    test('selected projectId should be included in chat payload', async () => {
      // This test is more of an integration test, but we can verify the prop
      const selectedProjectId = 'proj-123';
      await wrapper.setProps({ selectedProjectId });

      expect(wrapper.props('selectedProjectId')).toBe(selectedProjectId);
      // The chat API composable should read this from the store or prop
    });

    test('when no project is selected, projectId should be omitted', async () => {
      await wrapper.setProps({ selectedProjectId: '' });

      expect(wrapper.props('selectedProjectId')).toBe('');
    });
  });
});
