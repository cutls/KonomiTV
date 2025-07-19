<template>
    <div class="timetable__channel">
        <img
            class="timetable__channel-logo"
            loading="lazy"
            decoding="async"
            :src="`${Utils.api_base_url}/channels/${channel.id}/logo`"
        />
        <p class="timetable__channel-name">
            {{ channel.name }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import Utils from '@/utils';

// Props の定義
defineProps({
    channel: {
        type: Object,
        required: true,
    },
    has_bar: {
        type: Boolean,
        default: false,
    },
});
</script>

<style lang="scss" scoped>
.timetable {
    &__channel {
        display: flex;
        align-items: center;
        position: sticky;
        top: 5px;
        left: 0;
        background-color: rgb(var(--v-theme-background-lighten-2));
        padding: 2px;
    }
    &__channel-logo {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        margin-right: 8px;
    }
    &__channel-name {
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}
</style>
