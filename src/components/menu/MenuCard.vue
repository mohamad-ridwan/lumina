<script setup>
import { Button, Menu } from 'primevue';
import { ref, defineExpose, defineProps } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  toggleMenu: {
    type: Function,
  },
  btnMenuIcon: {
    type: String,
    default: 'pi pi-ellipsis-v'
  },
  btnSize: {
    type: String,
    default: 'small'
  },
  btnIconClass: {
    type: String,
    default: '!text-xs'
  },
  menuId: {
    type: String,
  },
  menuClass: {
    type: String,
  },
  menuStyle: {
    type: String,
  },
  appendTo: {
    type: String,
    default: 'body'
  },
  btnMenuClass: {
    type: String,
    default: 'p-button-rounded p-button-text'
  },
  btnMenuAriaControls: {
    type: String,
  },
  btnMenuAriaHaspopup: {
    type: String,
  },
  btnMenuRounded: {
    type: Boolean,
    default: false
  },
  btnMenuSeverity: {
    type: String,
  },
  btnMenuType: {
    type: String,
    default: 'button'
  },
  btnMenuAriaLabel: {
    type: String,
  },
  isUseBtnToggle: {
    type: Boolean,
    default: true
  },
  itemDirection: {
    type: String,
  }
})
const emits = defineEmits(['show', 'hide']);

const menu = ref(null);

defineExpose({
  menu // Expose the menuRef to the parent component
});

const onShow = (event) => {
  emits('show', event);
}
const onHide = (event) => {
  emits('hide', event);
}
</script>

<template>
  <Button v-if="props.isUseBtnToggle" :icon="props.btnMenuIcon" :class="props.btnMenuClass" @click="props.toggleMenu"
    aria-label="Menu" :size="props.btnSize" :icon-class="btnIconClass" :aria-controls="props.btnMenuAriaControls"
    :aria-haspopup="props.btnMenuAriaHaspopup" :rounded="props.btnMenuRounded" :severity="props.btnMenuSeverity"
    :type="props.btnMenuType" :aria-label="props.btnMenuAriaLabel" />
  <Menu :id="menuId" ref="menu" :model="props.items" :class="props.menuClass" popup @show="onShow" @hide="onHide"
    :style="props.menuStyle" :append-to="props.appendTo">
    <template #item="{ item }">
      <button :dir="itemDirection" class="flex items-center gap-2 py-1.5 px-2.5 cursor-pointer w-full"><i
          v-if="item?.icon" :class="['pi', item.icon, item.iconClass]"></i>
        <span :class="item.labelClass">{{ item.label }}</span></button>
    </template>
  </Menu>
</template>
