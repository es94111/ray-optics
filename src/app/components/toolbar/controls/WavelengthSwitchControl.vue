<!--
  Copyright 2026 The Ray Optics Simulation authors and contributors

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

<template>
  <div 
    class="row settings-control-row d-flex justify-content-between align-items-center"
    v-tooltip-popover:[tooltipType]="layout === 'desktop' && popoverContent ? { 
      content: popoverContent,
      html: true,
      placement: 'left',
      offset: [verticalOffset, 20]
    } : undefined"
  >
    <div class="col-auto settings-label" v-html="label"></div>
    <div class="col-auto d-flex align-items-center">
      <input 
        type="text" 
        class="settings-number" 
        :class="{ 'settings-control-value--disabled': disabled }"
        v-model="inputValue"
        :disabled="disabled"
        @keyup.enter="handleEnter"
        @keydown="handleKeydown"
        @blur="handleBlur"
        @click="!disabled && $event.target.select()"
      >
      <button 
        class="btn shadow-none wavelength-next-btn" 
        :class="{ 'settings-control-value--disabled': disabled }"
        :disabled="disabled" 
        :title="nextLabel"
        @click="handleNext"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
/**
 * @module WavelengthSwitchControl
 * @description The vue component for the current-wavelength value (editable) with a "next" button, used by the wavelength switching feature in the setting dropdown.
 * @vue-prop {String} label - The label for the control.
 * @vue-prop {Number} modelValue - The current wavelength (nm).
 * @vue-prop {String} layout - The layout of the control. Can be 'mobile' or 'desktop'.
 * @vue-prop {String} [popoverContent=''] - The content of the popover.
 * @vue-prop {Number} [verticalOffset=0] - The vertical offset of the popover.
 * @vue-prop {Number} min - The minimum allowed wavelength.
 * @vue-prop {Number} max - The maximum allowed wavelength.
 * @vue-prop {Boolean} [disabled=false] - If true, the control is read-only and visually de-emphasized.
 * @vue-prop {String} [nextLabel=''] - The tooltip title of the "next" button.
 */
import { computed, toRef, ref, watch } from 'vue'
import { vTooltipPopover } from '../../../directives/tooltip-popover'
import { usePreferencesStore } from '../../../store/preferences'

export default {
  name: 'WavelengthSwitchControl',
  directives: {
    'tooltip-popover': vTooltipPopover
  },
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: Number,
      required: true
    },
    layout: {
      type: String,
      required: true
    },
    popoverContent: {
      type: String,
      default: ''
    },
    verticalOffset: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    nextLabel: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const preferences = usePreferencesStore()
    const help = toRef(preferences, 'help')
    const tooltipType = computed(() => help.value ? 'popover' : null)

    const inputValue = ref(Math.round(props.modelValue).toString())

    // Watch for external changes to modelValue (e.g. from the "next" button or auto-switch timer)
    watch(() => props.modelValue, (newVal) => {
      inputValue.value = Math.round(newVal).toString()
    })

    const validateAndEmit = (value) => {
      const parsed = parseFloat(value)
      if (value === '' || Number.isNaN(parsed)) {
        inputValue.value = Math.round(props.modelValue).toString()
        return
      }
      const clamped = Math.min(props.max, Math.max(props.min, Math.round(parsed)))
      inputValue.value = clamped.toString()
      emit('update:modelValue', clamped)
    }

    return {
      tooltipType,
      inputValue,
      validateAndEmit
    }
  },
  methods: {
    handleKeydown(e) {
      e.stopPropagation()
    },
    handleEnter(e) {
      if (this.disabled) return
      this.validateAndEmit(e.target.value)
      e.target.select() // Re-select the text after validation
    },
    handleBlur(e) {
      if (this.disabled) return
      this.validateAndEmit(e.target.value)
    },
    handleNext(e) {
      e.target.blur()
      if (!this.disabled) this.$emit('next')
    }
  },
  emits: ['update:modelValue', 'next']
}
</script>

<style scoped>
.settings-number {
  height: 23px;
  margin-right: 4px;
}

.wavelength-next-btn {
  height: 30px;
  padding-left: 7px;
  padding-right: 7px;
  padding-top: 0;
  padding-bottom: 0;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
}
</style>
