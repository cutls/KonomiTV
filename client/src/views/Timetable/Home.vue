<template>
    <div class="route-container">
        <HeaderBar />
        <main>
            <Navigation />
            <div class="reservations-home-container-wrapper">
                <SPHeaderBar />
                <div class="reservations-home-container">
                    <Breadcrumbs
                        :crumbs="[
                            { name: 'ホーム', path: '/' },
                            {
                                name: '番組表',
                                path: '/timetable/',
                                disabled: true,
                            },
                        ]"
                    />
                    <div style="display: flex">
                        <div v-for="timetable in timetables">
                            <h2>{{ timetable.channel.name }}</h2>
                            <p v-for="program in timetable.programs">
                                {{ program.start_time }} - {{ program.title }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";

import Breadcrumbs from "@/components/Breadcrumbs.vue";
import HeaderBar from "@/components/HeaderBar.vue";
import Navigation from "@/components/Navigation.vue";
import SPHeaderBar from "@/components/SPHeaderBar.vue";
import Timetable, { ITimetableData } from "@/services/Timetable";
import { ChannelType } from "@/services/Channels";

// 放送が近い録画予約のリスト
const timetables = ref<ITimetableData[]>([]);

const is_loading = ref(true);
const target_type = ref<ChannelType>("GR");
const day = ref(6); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日

// 放送が近い録画予約を取得
const fetchTimetable = async (type: ChannelType, day: number) => {
    const result = await Timetable.fetchTimetable(type, day);
    return result ? result : [];
};

// セクションの更新関数を管理するオブジェクト
const sectionUpdaters = {
    getTimetable: fetchTimetable,
} as const;

// 開始時に実行
onMounted(() => {
    sectionUpdaters
        .getTimetable(target_type.value, day.value)
        .then((timetable) => {
            if (timetable) {
                timetables.value = timetable;
            }
        })
        .finally(() => {
            is_loading.value = false;
        });
});
</script>

<style lang="scss" scoped>
.reservations-home-container-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0; // very important!!! これがないと要素がはみ出す
}

.reservations-home-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px;
    margin: 0 auto;
    min-width: 0;
    max-width: 1000px;

    @include smartphone-horizontal {
        padding: 16px 20px !important;
    }

    @include smartphone-horizontal-short {
        padding: 16px !important;
    }

    @include smartphone-vertical {
        padding: 8px 8px 20px !important;
    }

    :deep(.reservation-list) {
        & + .reservation-list {
            margin-top: 40px;
            @include smartphone-vertical {
                margin-top: 32px;
            }
        }
    }

    &__upcoming-reservations--loading,
    &__recently-finished-reservations--loading,
    &__all-reservations--loading {
        :deep(.reservation-list__table-container),
        :deep(.reservation-list__empty) {
            min-height: 180px;
        }
    }
}
</style>
