<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { CITIES } from '@/data/cities';
import PolicyLink from '../shared/PolicyLink.vue';

const input = useInputStore();
const settings = useSettingsStore();
const { reliefs } = storeToRefs(input);

const policies = computed(() => CITIES[settings.cityId].reliefPolicies);

const labelByCategory: Record<string, string> = {
  disability: '残疾人',
  elderly_alone: '孤老',
  martyr_family: '烈属',
};

const toggle = (id: string) => {
  const idx = reliefs.value.indexOf(id);
  if (idx >= 0) reliefs.value.splice(idx, 1);
  else {
    const policy = policies.value.find(p => p.id === id);
    if (policy) {
      const sameCat = policies.value.filter(p => p.category === policy.category).map(p => p.id);
      reliefs.value = reliefs.value.filter(r => !sameCat.includes(r));
    }
    reliefs.value.push(id);
  }
};

const isOn = (id: string) => reliefs.value.includes(id);
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-4px">税收优惠（减征政策）</h3>
    <p class="text-11px text-mute mb-12px">同一类别多个政策互斥，不同类别可叠加</p>

    <div class="space-y-10px">
      <div
        v-for="p in policies"
        :key="p.id"
        class="border border-stone-100 rounded-10px p-12px transition"
        :class="isOn(p.id) ? 'ring-2 ring-primary/30 bg-primary/5' : 'bg-white'"
      >
        <div class="flex items-start justify-between gap-10px cursor-pointer" @click="toggle(p.id)">
          <div>
            <div class="flex items-center gap-6px">
              <span class="text-12px px-6px py-2px rounded-4px bg-stone-100 text-mute">
                {{ labelByCategory[p.category] }}
              </span>
              <span class="text-13px font-medium text-ink">{{ p.description }}</span>
            </div>
          </div>
          <input :checked="isOn(p.id)" type="checkbox" class="mt-2px" @click.stop="toggle(p.id)" />
        </div>
        <div v-if="isOn(p.id)" class="mt-10px">
          <PolicyLink :title="p.source.title" :url="p.source.url" />
        </div>
      </div>
    </div>
  </section>
</template>
