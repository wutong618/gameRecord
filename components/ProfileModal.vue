<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="close"
      >
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          style="background: radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85));"
          @click="close"
        />

        <div
          class="relative w-full max-w-md glass-card-elevated rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <!-- 顶部装饰条（青色辉光） -->
          <div
            class="absolute top-0 inset-x-0 h-px"
            style="background: linear-gradient(90deg, transparent, #00ffff, transparent); box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"
          />

          <!-- 标题 -->
          <div class="text-center mb-5 pt-1">
            <h3 class="font-pingfang text-xl text-white tracking-[0.05em]">完善个人资料</h3>
            <p class="text-slate-500 text-[11px] mt-1.5">绑定后可在多设备同步你的身份</p>
          </div>

          <!-- 当前头像 / 昵称预览 -->
          <div class="flex flex-col items-center mb-5">
            <div class="relative">
              <!-- 头像（带霓虹环） -->
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-2 ring-offset-2 ring-offset-slate-800"
                :style="{
                  background: avatarStyle.background,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: `0 0 20px ${getGlow(form.avatarColor)}`,
                  '--tw-ring-color': getGlow(form.avatarColor)
                }"
              >
                <img v-if="form.avatarUrl" :src="form.avatarUrl" class="w-full h-full object-cover" />
                <span v-else>{{ (form.nickname || '?').slice(0, 1) }}</span>
              </div>
              <!-- 上传中扫描光环 -->
              <div
                v-if="uploading"
                class="absolute -inset-1 rounded-full pointer-events-none"
                style="background: conic-gradient(from 0deg, transparent 0%, #00ffff 50%, transparent 100%); animation: spin 1.2s linear infinite;"
              >
                <div class="w-full h-full rounded-full bg-slate-800" style="margin: 2px;" />
              </div>
            </div>
            <div class="font-pingfang text-white text-sm font-bold mt-2.5">{{ form.nickname }}</div>
            <div
              v-if="user?.isTemporary"
              class="text-[10px] uppercase tracking-[0.2em] font-heading text-amber-400 mt-0.5"
            >
              临时身份
            </div>
          </div>

          <!-- Tab 切换（滑块式） -->
          <div class="relative flex mb-4 gap-0">
            <div
              class="absolute top-1 bottom-1 w-1/2 rounded-lg pointer-events-none transition-transform duration-300 ease-out"
              :class="activeTab === 'wechat' ? 'translate-x-0' : 'translate-x-full'"
              :style="{
                background: activeTab === 'wechat'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(52, 211, 153, 0.2))'
                  : 'linear-gradient(135deg, rgba(0, 255, 255, 0.25), rgba(57, 255, 20, 0.2))',
                boxShadow: activeTab === 'wechat'
                  ? '0 0 12px rgba(16, 185, 129, 0.4), inset 0 0 0 1px rgba(16, 185, 129, 0.4)'
                  : '0 0 12px rgba(0, 255, 255, 0.4), inset 0 0 0 1px rgba(0, 255, 255, 0.4)'
              }"
            />
            <button
              class="relative flex-1 py-2.5 rounded-lg font-heading text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 z-10"
              :class="activeTab === 'wechat' ? 'text-glow-green' : 'text-slate-500'"
              @click="activeTab = 'wechat'"
            >
              <Sparkles class="w-3.5 h-3.5" :stroke-width="2.5" />
              微信一键
            </button>
            <button
              class="relative flex-1 py-2.5 rounded-lg font-heading text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 z-10"
              :class="activeTab === 'manual' ? 'text-glow-cyan' : 'text-slate-500'"
              @click="activeTab = 'manual'"
            >
              <Settings2 class="w-3.5 h-3.5" :stroke-width="2.5" />
              手动修改
            </button>
          </div>

          <!-- 微信 mock -->
          <div v-if="activeTab === 'wechat'" class="space-y-3">
            <div class="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/40 text-[11px] text-slate-400 leading-relaxed">
              <span class="text-amber-400">⚠</span> 演示阶段：模拟微信网页授权。生产环境会跳转到微信 OAuth 获取真实 openid。
            </div>
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1">openid</label>
              <input
                v-model="wechatForm.openid"
                type="text"
                placeholder="演示用任意字符串"
                class="font-num w-full bg-slate-900/60 text-white text-sm py-2.5 px-3 rounded-lg border border-slate-700/60 focus:border-neon-green/60 focus:ring-2 focus:ring-neon-green/20 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1">昵称</label>
              <input
                v-model="wechatForm.nickname"
                type="text"
                maxlength="20"
                placeholder="微信昵称"
                class="font-pingfang w-full bg-slate-900/60 text-white text-sm py-2.5 px-3 rounded-lg border border-slate-700/60 focus:border-neon-green/60 focus:ring-2 focus:ring-neon-green/20 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1">头像 URL</label>
              <input
                v-model="wechatForm.avatarUrl"
                type="text"
                placeholder="演示用任意 URL"
                class="font-num w-full bg-slate-900/60 text-white text-sm py-2.5 px-3 rounded-lg border border-slate-700/60 focus:border-neon-green/60 focus:ring-2 focus:ring-neon-green/20 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <button
              class="w-full py-3 rounded-xl font-pingfang font-bold text-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 active:scale-95 mt-2"
              style="background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 4px 16px -4px rgba(16, 185, 129, 0.5);"
              :disabled="!wechatForm.openid || !wechatForm.nickname || saving"
              @click="bindWechat"
            >
              <LoaderCircle v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2.5" />
              <Sparkles v-else class="w-4 h-4" :stroke-width="2.5" />
              {{ saving ? '同步中…' : '一键同步并升级为正式用户' }}
            </button>
          </div>

          <!-- 手动修改 -->
          <div v-else class="space-y-3">
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1">昵称</label>
              <input
                v-model="form.nickname"
                type="text"
                maxlength="20"
                class="font-pingfang w-full bg-slate-900/60 text-white text-sm py-2.5 px-3 rounded-lg border border-slate-700/60 focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-2">头像颜色</label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="key in colorKeys"
                  :key="key"
                  type="button"
                  class="aspect-square rounded-lg border-2 transition-all duration-200 active:scale-95"
                  :class="form.avatarColor === key ? 'border-white scale-110 shadow-[0_0_12px_var(--c)]' : 'border-slate-700/60 hover:border-slate-500'"
                  :style="{
                    background: COLORS[key].bg,
                    '--c': COLORS[key].neon,
                    boxShadow: form.avatarColor === key ? `0 0 16px ${COLORS[key].neon}` : 'none'
                  }"
                  @click="form.avatarColor = key"
                />
              </div>
            </div>
            <div>
              <label class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1.5">自定义头像</label>
              <button
                type="button"
                class="w-full py-2.5 rounded-lg border border-dashed text-sm transition-all duration-200 flex items-center justify-center gap-2"
                :class="uploading
                  ? 'border-neon-cyan/60 text-neon-cyan'
                  : 'border-slate-700/60 text-slate-400 hover:border-neon-blue/60 hover:text-neon-blue'"
                :disabled="uploading"
                @click="triggerUpload"
              >
                <LoaderCircle v-if="uploading" class="w-4 h-4 animate-spin" :stroke-width="2.5" />
                <Upload v-else-if="!form.avatarUrl" class="w-4 h-4" :stroke-width="2.5" />
                <Check v-else class="w-4 h-4 text-neon-green" :stroke-width="2.5" />
                <span>
                  {{ uploading ? '上传中…' : (form.avatarUrl ? '已上传，点击重新选择' : '点击上传（≤2MB）') }}
                </span>
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
              class="btn-cyber-primary w-full py-3 rounded-xl font-pingfang flex items-center justify-center gap-2 mt-2"
              :disabled="!form.nickname || saving"
              @click="saveManual"
            >
              <LoaderCircle v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2.5" />
              <Save v-else class="w-4 h-4" :stroke-width="2.5" />
              {{ saving ? '保存中…' : '保存修改' }}
            </button>
          </div>

          <button
            class="btn-cyber-ghost w-full mt-4 py-2 rounded-lg font-pingfang text-xs"
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
import { Sparkles, Settings2, Upload, Check, LoaderCircle, Save } from 'lucide-vue-next'

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
  if (form.value.avatarUrl) {
    return { background: `url(${form.value.avatarUrl})` }
  }
  const key = (form.value.avatarColor || 'fire-red') as keyof typeof COLORS
  const c = COLORS[key] || COLORS['fire-red']
  return { background: c.bg }
})

function getGlow(colorKey: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof COLORS
  return COLORS[key]?.neon || COLORS['fire-red'].neon
}

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
    const imageCompression = (await import('browser-image-compression')).default
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      exifOrientation: 1
    })
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
.modal-fade-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active { transition: all 0.15s ease-in; }
.modal-fade-enter-from { opacity: 0; transform: translateY(20px) scale(0.96); }
.modal-fade-leave-to   { opacity: 0; transform: translateY(8px) scale(0.98); }
</style>
