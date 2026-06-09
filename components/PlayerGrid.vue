<template>
  <div
    class="grid gap-3"
    :class="gridColsClass"
  >
    <SeatSlot
      v-for="seat in session.seats"
      :key="seat.seatIndex"
      :user="seat.user"
      :is-self="isSelfSeat(seat.seatIndex)"
      :score="totalScores[seat.seatIndex] ?? 0"
      :uploading="false"
      size="md"
      @click="onSeatClick(seat.seatIndex, seat.user)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameSession, User } from '~/types'
import SeatSlot from './SeatSlot.vue'

const props = defineProps<{
  session: GameSession
  currentUser: User | null
  totalScores: number[]
}>()

const emit = defineEmits<{
  (e: 'seat-click', payload: { seatIndex: number; user: User | null; isSelf: boolean }): void
}>()

// 2-10 人自适应 grid 列数
const gridColsClass = computed(() => {
  const n = props.session.maxPlayers
  if (n <= 3) return 'grid-cols-3'
  if (n <= 4) return 'grid-cols-4'
  if (n <= 6) return 'grid-cols-3 sm:grid-cols-6'
  if (n <= 8) return 'grid-cols-4 sm:grid-cols-8'
  return 'grid-cols-5 sm:grid-cols-5'  // 9-10
})

function isSelfSeat(seatIndex: number): boolean {
  const seat = props.session.seats[seatIndex]
  if (!seat?.user || !props.currentUser) return false
  return seat.user.id === props.currentUser.id
}

function onSeatClick(seatIndex: number, user: User | null) {
  const isSelf = isSelfSeat(seatIndex)
  emit('seat-click', { seatIndex, user, isSelf })
}
</script>
