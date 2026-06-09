import { ref, watch } from 'vue'

/**
 * 打字机效果 hook
 * 用法：
 *   const { displayText, isTyping, start, finish } = useTypewriter()
 *   start('要显示的文本', 30)   // 30ms/字
 *   finish()                       // 立即完成
 */
export function useTypewriter(speed = 30) {
  const fullText = ref('')
  const displayText = ref('')
  const isTyping = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let onDone: (() => void) | null = null

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isTyping.value = false
  }

  function typeNext(i: number) {
    if (i > fullText.value.length) {
      isTyping.value = false
      if (onDone) onDone()
      return
    }
    displayText.value = fullText.value.slice(0, i)
    timer = setTimeout(() => typeNext(i + 1), speed)
  }

  function start(text: string, onComplete?: () => void) {
    clear()
    fullText.value = text
    displayText.value = ''
    isTyping.value = true
    onDone = onComplete || null
    if (text.length === 0) {
      isTyping.value = false
      if (onDone) onDone()
      return
    }
    timer = setTimeout(() => typeNext(1), speed)
  }

  function finish() {
    if (timer) clearTimeout(timer)
    timer = null
    displayText.value = fullText.value
    isTyping.value = false
    if (onDone) onDone()
  }

  // 文本变化时自动重新打字
  watch(fullText, (val, oldVal) => {
    if (val !== oldVal) start(val)
  })

  return { displayText, isTyping, start, finish, fullText }
}
