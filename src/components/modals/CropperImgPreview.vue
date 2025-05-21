<script setup>
import { Dialog, Button } from 'primevue'
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import { ref, toRefs, watch } from 'vue'

const props = defineProps({
  imgUploaded: String
})
const emit = defineEmits(['close'])

const cropperRef = ref(null)
const { imgUploaded } = toRefs(props)
const coordinates = ref(null)
const visible = ref(false)

const close = () => emit('close')

const handleSubmit = () => {
  const canvas = cropperRef.value?.getResult()?.canvas
  if (canvas) {
    const croppedDataUrl = canvas.toDataURL()
    close()
  }
}

const onChangeImgUploaded = ({ coordinates: coords }) => {
  coordinates.value = coords
}

watch(imgUploaded, (url) => {
  visible.value = !!url
})
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Set Image to Fit" :style="{ width: '400px' }" @hide="close"
    :dismissableMask="true">
    <Cropper ref="cropperRef" :src="props.imgUploaded" :stencil-props="{ aspectRatio: 1 }" class="h-[300px] w-full"
      @change="onChangeImgUploaded" />

    <template #footer>
      <Button label="Cancel" severity="secondary" @click="close" />
      <Button icon="pi pi-check" label="Apply" severity="success" @click="handleSubmit" />
    </template>
  </Dialog>
</template>
