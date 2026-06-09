<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />
        <div
          class="relative w-full max-w-md bg-slate-800 rounded-t-3xl sm:rounded-2xl p-6 border-t sm:border border-slate-700 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-xl font-bold text-white mb-1 text-center">完善个人资料</h3>
          <p class="text-slate-400 text-xs text-center mb-5">绑定后可在多设备同步你的身份</p>

          <!-- 当前头像 / 昵称预览 -->
          <div class="flex flex-col items-center mb-5">
            <div
              class="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 overflow-hidden"
              :style="avatarStyle"
            >
              <img v-if="form.avatarUrl" :src="form.avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ (form.nickname || '?').slice(0, 1) }}</span>
            </div>
            <div class="text-white text-sm font-bold mt-2">{{ form.nickname }}</div>
            <div v-if="user?.isTemporary" class="text-[10px] text-amber-400">临时身份</div>
          </div>

          <!-- Tab 切换 -->
          <div class="flex gap-2 mb-4">
            <button
              class="flex-1 py-2 rounded-lg font-bold text-sm transition-all"
              :class="activeTab === 'wechat' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'"
              @click="activeTab = 'wechat'"
            >
              微信一键同步
            </button>
            <button
              class="flex-1 py-2 rounded-lg font-bold text-sm transition-all"
              :class="activeTab === 'manual' ? 'bg-neon-blue text-slate-900' : 'bg-slate-700 text-slate-300'"
              @click="activeTab = 'manual'"
            >
              手动修改
            </button>
          </div>

          <!-- 微信 mock -->
          <div v-if="activeTab === 'wechat'" class="space-y-3">
            <div class="text-xs text-slate-400 leading-relaxed">
              演示阶段：模拟微信网页授权。生产环境会跳转到微信 OAuth 获取真实 openid。
            </div>
            <input
              v-model="wechatForm.openid"
              type="text"
              placeholder="微信 openid（演示用任意字符串）"
              class="w-full bg-slate-700 text-white text-sm py-2 px-3 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none"
            />
            <input
              v-model="wechatForm.nickname"
              type="text"
              maxlength="20"
              placeholder="微信昵称"
              class="w-full bg-slate-700 text-white text-sm py-2 px-3 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none"
            />
            <input
              v-model="wechatForm.avatarUrl"
              type="text"
              placeholder="微信头像 URL（演示用任意 URL）"
              class="w-full bg-slate-700 text-white text-sm py-2 px-3 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none"
            />
            <button
              class="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-900 disabled:opacity-50"
              :disabled="!wechatForm.openid || !wechatForm.nickname || saving"
              @click="bindWechat"
            >
              {{ saving ? '同步中…' : '一键同步并升级为正式用户' }}
            </button>
          </div>

          <!-- 手动修改 -->
          <div v-else class="space-y-3">
            <div>
              <label class="text-xs text-slate-400">昵称</label>
              <input
                v-model="form.nickname"
                type="text"
                maxlength="20"
                class="w-full bg-slate-700 text-white text-sm py-2 px-3 rounded-lg border border-slate-600 focus:border-neon-blue outline-none mt-1"
              />
            </div>
            <div>
              <label class="text-xs text-slate-400">头像颜色</label>
              <div class="grid grid-cols-5 gap-2 mt-1">
                <button
                  v-for="key in colorKeys"
                  :key="key"
                  type="button"
                  class="aspect-square rounded-lg border-2 transition-all"
                  :class="form.avatarColor === key ? 'border-white scale-110' : 'border-slate-600'"
                  :style="{ background: COLORS[key].bg }"
                  @click="form.avatarColor = key"
                />
              </div>
            </div>
            <div>
              <label class="text-xs text-slate-400">自定义头像图片（png/jpg/webp/gif，≤2MB）</label>
              <button
                type="button"
                class="mt-1 w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 text-sm hover:border-neon-blue hover:text-neon-blue transition-colors"
                :disabled="uploading"
                @click="triggerUpload"
              >
                {{ uploading ? '上传中…' : (form.avatarUrl ? '✓ 已上传，点击重新选择' : '点击上传') }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                class="hidden"
                @change="onFileChange"
              />
            </div>
            <button
              class="w-full py-3 rounded-xl font-bold bg-neon-blue text-slate-900 disabled:opacity-50"
              :disabled="!form.nickname || saving"
              @click="saveManual"
            >
              {{ saving ? '保存中…' : '保存修改' }}
            </button>
          </div>

          <button
            class="w-full mt-3 py-2 text-slate-500 hover:text-slate-300 text-xs"
            @click="close"
          >
            稍后再说
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '~/types'
import { PLAYER_COLORS } from '~/types'
import { useUser } from '~/composables/useUser'

const props = defineProps<{ show: boolean; user: User | null }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', user: User): void
}>()

const COLORS = PLAYER_COLORS
const colorKeys = Object.keys(COLORS) as (keyof typeof COLORS)[]

const userApi = useUser()

const activeTab = ref<'wechat' | 'manual'>('wechat')

const form = ref({
  nickname: '',
  avatarUrl: '' as string | null,
  avatarColor: 'fire-red' as string
})

const wechatForm = ref({
  openid: '',
  nickname: '',
  avatarUrl: ''
})

const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const uploading = ref(false)

watch(() => props.user, (u) => {
  if (u) {
    form.value.nickname = u.nickname
    form.value.avatarUrl = u.avatarUrl
    form.value.avatarColor = (u.avatarColor || 'fire-red') as string
  }
}, { immediate: true })

const avatarStyle = computed(() => {
  const key = (form.value.avatarColor || 'fire-red') as keyof typeof COLORS
  const c = COLORS[key] || COLORS['fire-red']
  return {
    background: form.value.avatarUrl ? `url(${form.value.avatarUrl})` : c.bg,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderColor: c.neon
  }
})

function close() {
  if (saving.value || uploading.value) return
  emit('close')
}

function triggerUpload() {
  if (uploading.value) return
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  await uploadAvatar(file)
}

async function uploadAvatar(file: File) {
  if (!props.user) return
  uploading.value = true
  try {
    // 压缩
    const imageCompression = (await import('browser-image-compression')).default
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      exifOrientation: 1
    })
    // 上传到 Blob
    const { upload } = await import('@vercel/blob/client')
    const pathname = `avatars/${props.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const blob = await upload(pathname, compressed, {
      access: 'public',
      handleUploadUrl: '/api/users/me/avatar',
      clientPayload: JSON.stringify({ userId: props.user.id }),
      contentType: compressed.type || 'image/jpeg'
    })
    form.value.avatarUrl = blob.url
  } catch (e: any) {
    alert('上传失败：' + (e?.message || e))
  } finally {
    uploading.value = false
  }
}

async function saveManual() {
  if (!props.user) return
  saving.value = true
  try {
    const updated = await userApi.updateProfile({
      nickname: form.value.nickname,
      avatarUrl: form.value.avatarUrl || null,
      avatarColor: form.value.avatarColor
    })
    if (updated) emit('saved', updated)
    emit('close')
  } catch (e: any) {
    console.error('[ProfileModal] saveManual error:', e)
    alert('保存失败：' + (e?.statusMessage || e?.data?.statusMessage || e?.message || JSON.stringify(e)))
  } finally {
    saving.value = false
  }
}

async function bindWechat() {
  if (!props.user) return
  saving.value = true
  try {
    const updated = await userApi.bindWechat(
      wechatForm.value.openid,
      wechatForm.value.nickname,
      wechatForm.value.avatarUrl
    )
    if (updated) {
      form.value.nickname = updated.nickname
      form.value.avatarUrl = updated.avatarUrl
      form.value.avatarColor = (updated.avatarColor || 'fire-red') as string
      emit('saved', updated)
    }
    emit('close')
  } catch (e: any) {
    console.error('[ProfileModal] bindWechat error:', e)
    alert('绑定失败：' + (e?.statusMessage || e?.data?.statusMessage || e?.message || JSON.stringify(e)))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
