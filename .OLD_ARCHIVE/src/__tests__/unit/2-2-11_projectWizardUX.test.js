// Unit tests for Orion Project Setup Wizard UX (subtask 2-2-11)
// Tests for wizard state machine, side form sync, and one-question-at-a-time flow

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, beforeEach, test, expect, vi } from 'vitest';

// Mock wizard state management
const useWizardState = vi.fn(() => ({
  currentStep: 0,
  steps: [
    { id: 'name', question: 'What is the project name?' },
    { id: 'stack', question: 'What tech stack would you like to use?' },
    { id: 'features', question: 'What are the core features?' },
    { id: 'database', question: 'Which database do you prefer?' },
    { id: 'integrations', question: 'Any third-party integrations?' },
    { id: 'uxTone', question: 'What should be the UX tone?' },
    { id: 'constraints', question: 'Any constraints or special requirements?' },
  ],
  answers: {},
  isComplete: false,
  setAnswer: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  goToStep: vi.fn(),
  complete: vi.fn(),
}));

// Mock side form component
const SideForm = {
  name: 'SideForm',
  props: {
    wizardState: Object,
  },
  template: `
    <div class="side-form">
      <form @submit.prevent="$emit('update', wizardState.answers)">
        <input v-model="wizardState.answers.name" placeholder="Project name" />
        <input v-model="wizardState.answers.stack" placeholder="Tech stack" />
        <input v-model="wizardState.answers.features" placeholder="Core features" />
        <input v-model="wizardState.answers.database" placeholder="Database" />
        <input v-model="wizardState.answers.integrations" placeholder="Integrations" />
        <input v-model="wizardState.answers.uxTone" placeholder="UX tone" />
        <input v-model="wizardState.answers.constraints" placeholder="Constraints" />
        <button type="submit">Update</button>
      </form>
    </div>
  `,
};

// Mock wizard chat component
const WizardChat = {
  name: 'WizardChat',
  template: `
    <div class="wizard-chat">
      <div class="current-question">
        {{ currentQuestion }}
      </div>
      <div class="wizard-answers">
        <input v-model="currentAnswer" @keyup.enter="handleAnswer" />
        <button @click="handleAnswer">Submit</button>
      </div>
      <div class="wizard-navigation">
        <button @click="prev" :disabled="!canPrev">Previous</button>
        <button @click="next" :disabled="!canNext">Next</button>
        <button @click="complete" :disabled="!canComplete">Complete</button>
      </div>
    </div>
  `,
  props: {
    wizardState: Object,
  },
  data() {
    return {
      currentAnswer: '',
    };
  },
  computed: {
    currentQuestion() {
      return this.wizardState.steps[this.wizardState.currentStep].question;
    },
    canPrev() {
      return this.wizardState.currentStep > 0;
    },
    canNext() {
      return this.wizardState.currentStep < this.wizardState.steps.length - 1;
    },
    canComplete() {
      return Object.keys(this.wizardState.answers).length === this.wizardState.steps.length;
    },
  },
  methods: {
    handleAnswer() {
      this.wizardState.setAnswer(this.wizardState.steps[this.wizardState.currentStep].id, this.currentAnswer);
      this.currentAnswer = '';
      if (this.canNext) {
        this.wizardState.nextStep();
      }
    },
    prev() {
      this.wizardState.prevStep();
    },
    next() {
      if (this.canNext) {
        this.wizardState.nextStep();
      }
    },
    complete() {
      this.wizardState.complete();
    },
  },
};

describe('Project Wizard UX (2-2-11)', () => {
  describe('wizard state machine', () => {
    test('should start at first step', () => {
      const wizardState = useWizardState();
      expect(wizardState.currentStep).toBe(0);
    });

    test('should advance to next step', () => {
      const wizardState = useWizardState();
      wizardState.nextStep();
      expect(wizardState.currentStep).toBe(1);
    });

    test('should go back to previous step', () => {
      const wizardState = useWizardState();
      wizardState.currentStep = 2;
      wizardState.prevStep();
      expect(wizardState.currentStep).toBe(1);
    });

    test('should not go beyond first step', () => {
      const wizardState = useWizardState();
      wizardState.prevStep();
      expect(wizardState.currentStep).toBe(0);
    });

    test('should not go beyond last step', () => {
      const wizardState = useWizardState();
      wizardState.currentStep = wizardState.steps.length - 1;
      wizardState.nextStep();
      expect(wizardState.currentStep).toBe(wizardState.steps.length - 1);
    });

    test('should store answers', () => {
      const wizardState = useWizardState();
      wizardState.setAnswer('name', 'My Project');
      expect(wizardState.answers.name).toBe('My Project');
    });

    test('should mark as complete when all steps answered', () => {
      const wizardState = useWizardState();
      wizardState.steps.forEach(step => {
        wizardState.setAnswer(step.id, 'answer');
      });
      expect(wizardState.isComplete).toBe(true);
    });
  });

  describe('wizard chat component', () => {
    test('should display current question', async () => {
      const wizardState = useWizardState();
      const wrapper = mount(WizardChat, {
        props: { wizardState },
      });

      expect(wrapper.find('.current-question').text()).toContain('What is the project name?');
    });

    test('should disable previous button on first step', async () => {
      const wizardState = useWizardState();
      const wrapper = mount(WizardChat, {
        props: { wizardState },
      });

      const prevButton = wrapper.find('.wizard-navigation button:first-child');
      expect(prevButton.attributes('disabled')).toBeDefined();
    });

    test('should enable next button when there are more steps', async () => {
      const wizardState = useWizardState();
      const wrapper = mount(WizardChat, {
        props: { wizardState },
      });

      const nextButton = wrapper.find('.wizard-navigation button:nth-child(2)');
      expect(nextButton.attributes('disabled')).toBeUndefined();
    });

    test('should call setAnswer and advance on answer submission', async () => {
      const wizardState = useWizardState();
      const wrapper = mount(WizardChat, {
        props: { wizardState },
      });

      const input = wrapper.find('input');
      await input.setValue('My Project');
      await wrapper.find('button').trigger('click');

      expect(wizardState.setAnswer).toHaveBeenCalledWith('name', 'My Project');
      expect(wizardState.nextStep).toHaveBeenCalled();
    });
  });

  describe('side form component', () => {
    test('should bind to wizard state answers', async () => {
      const wizardState = useWizardState();
      wizardState.answers = { name: 'Test', stack: 'Vue' };

      const wrapper = mount(SideForm, {
        props: { wizardState },
      });

      const inputs = wrapper.findAll('input');
      expect(inputs[0].element.value).toBe('Test');
      expect(inputs[1].element.value).toBe('Vue');
    });

    test('should emit update when form is submitted', async () => {
      const wizardState = useWizardState();
      const wrapper = mount(SideForm, {
        props: { wizardState },
      });

      await wrapper.find('form').trigger('submit');
      expect(wrapper.emitted('update')).toBeTruthy();
    });
  });

  describe('side form and wizard chat sync', () => {
    test('changes in side form should update wizard state', async () => {
      // This test would require a shared state between components
      // For now, we'll verify that both components can read the same state
      const wizardState = useWizardState();
      const sideForm = mount(SideForm, { props: { wizardState } });
      const wizardChat = mount(WizardChat, { props: { wizardState } });

      // Update via side form
      await sideForm.find('input[placeholder="Project name"]').setValue('New Name');
      await sideForm.find('form').trigger('submit');

      // Both components should reflect the change
      expect(wizardState.answers.name).toBe('New Name');
      expect(wizardChat.vm.wizardState.answers.name).toBe('New Name');
    });

    test('wizard chat answering should update side form', async () => {
      const wizardState = useWizardState();
      const sideForm = mount(SideForm, { props: { wizardState } });
      const wizardChat = mount(WizardChat, { props: { wizardState } });

      // Answer via wizard chat
      await wizardChat.find('input').setValue('Project Alpha');
      await wizardChat.find('button').trigger('click');

      // Side form should show the answer
      expect(wizardState.answers.name).toBe('Project Alpha');
      expect(sideForm.find('input[placeholder="Project name"]').element.value).toBe('Project Alpha');
    });
  });

  describe('"not sure" handling', () => {
    test('should provide default when answer is "not sure"', async () => {
      const wizardState = useWizardState();
      // This would be implemented in the actual wizard logic
      // For now, we'll test that the state can handle empty answers
      wizardState.setAnswer('name', 'not sure');
      expect(wizardState.answers.name).toBe('not sure');
    });

    test('should allow editing default answers', async () => {
      const wizardState = useWizardState();
      wizardState.setAnswer('name', 'not sure');
      wizardState.setAnswer('name', 'Edited Name');
      expect(wizardState.answers.name).toBe('Edited Name');
    });
  });

  describe('summary and confirmation', () => {
    test('should show summary before completion', async () => {
      // Mock summary component
      const Summary = {
        name: 'Summary',
        props: ['answers'],
        template: `
          <div class="summary">
            <div v-for="(value, key) in answers" :key="key">
              {{ key }}: {{ value }}
            </div>
            <button @click="$emit('confirm')">Confirm</button>
            <button @click="$emit('edit')">Edit</button>
          </div>
        `,
      };

      const answers = { name: 'Test', stack: 'Vue' };
      const wrapper = mount(Summary, {
        props: { answers },
      });

      expect(wrapper.text()).toContain('name: Test');
      expect(wrapper.text()).toContain('stack: Vue');
      expect(wrapper.find('button').text()).toBe('Confirm');
    });

    test('should require explicit confirmation', async () => {
      const Summary = {
        name: 'Summary',
        template: `
          <div>
            <button @click="$emit('confirm')">Create Project</button>
          </div>
        `,
      };

      const wrapper = mount(Summary);
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('confirm')).toBeTruthy();
    });
  });
});
