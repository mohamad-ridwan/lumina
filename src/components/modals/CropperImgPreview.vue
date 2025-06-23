<script setup>
import { Dialog, Button } from 'primevue'
import { Cropper, CircleStencil } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import ChatWorkers from '@/services/workers/chat-workers.js?worker'

import { ref, toRefs, watch } from 'vue'

const props = defineProps({
  imgUploaded: Object,
})
const emit = defineEmits(['close', 'submit'])

const cropperRef = ref(null)
const { imgUploaded } = toRefs(props)
const coordinates = ref(null)
const visible = ref(false)
const loadingSubmit = ref(false)

const close = () => emit('close')

const handleSubmit = async () => {
  const canvas = cropperRef.value?.getResult()?.canvas
  if (canvas && !loadingSubmit.value) {
    loadingSubmit.value = true
    const imageBitmap = await createImageBitmap(canvas)
    if (!imageBitmap) {
      console.error('Error creating ImageBitmap:')
      loadingSubmit.value = false
      return
    }
    const worker = new ChatWorkers()
    worker.onmessage = (e) => {
      const resultData = e.data; // Ini bisa Blob atau DataURL dari worker
      if (resultData.error) {
        console.error('Web Worker error:', resultData.error);
      } else {
        emit('submit', resultData)
        close()
      }
      loadingSubmit.value = false
      worker.terminate();
    }
    worker.onerror = (error) => {
      console.error('Web Worker chats error:', error);
      loadingSubmit.value = false
      worker.terminate();
    };

    // 2. Kirim ImageBitmap ke worker sebagai transferable object
    worker.postMessage({ type: 'processImageProfile', imageBitmap: imageBitmap }, [imageBitmap]);
    // const croppedDataUrl = canvas.toDataURL()
    // emit('submit', croppedDataUrl)
  }
}

const onChangeImgUploaded = ({ coordinates: coords }) => {
  coordinates.value = coords
}

watch(imgUploaded, (image) => {
  visible.value = !!image?.imgCropped
})
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Set Image to Fit" :style="{ width: '400px' }" @hide="close"
    :dismissableMask="true">
    <Cropper ref="cropperRef" :src="imgUploaded.imgCropped" :stencil-component="CircleStencil"
      :stencil-props="{ aspectRatio: 1 }" class="h-[300px] w-full" @change="onChangeImgUploaded" />

    <template #footer>
      <div class="flex justify-end gap-2 items-center pt-4">
        <Button label="Cancel" severity="secondary" size="small" @click="close" />
        <Button icon="pi pi-check" label="Apply" size="small" :disabled="loadingSubmit" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>
