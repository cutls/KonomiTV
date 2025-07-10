<template>
    <div class="route-container">
        <HeaderBar />
        <main>
            <Navigation />
            <div class="timetable-home-container-wrapper">
                <SPHeaderBar />
                <div class="timetable-home-container">
                    <div v-if="is_loading" class="timetable__loading">
                        <v-progress-circular
                            indeterminate
                            color="primary"
                            size="50"
                        ></v-progress-circular>
                    </div>
                    <div
                        v-if="!is_loading"
                        style="
                            display: flex;
                            align-items: center;
                            margin-bottom: 10px;
                            flex-wrap: wrap;
                        "
                    >
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
                        <div style="width: 10px"></div>
                        <div>
                            <v-btn
                                variant="flat"
                                @click="updateTargetType('GR')"
                                :color="target_type === 'GR' ? 'primary' : ''"
                            >
                                地デジ
                            </v-btn>
                            <v-btn
                                variant="flat"
                                @click="updateTargetType('BS')"
                                :color="target_type === 'BS' ? 'primary' : ''"
                            >
                                BS
                            </v-btn>
                            <v-btn
                                variant="flat"
                                @click="updateTargetType('CS')"
                                :color="target_type === 'CS' ? 'primary' : ''"
                            >
                                CS
                            </v-btn>
                        </div>
                        <div style="width: 10px"></div>
                        <div>
                            <v-btn
                                v-for="(_, i) in dayOfWeek"
                                variant="flat"
                                @click="updateDay(dayjs().add(i, 'day').day())"
                                :color="
                                    day === dayjs().add(i, 'day').day()
                                        ? 'primary'
                                        : ''
                                "
                            >
                                {{ dayOfWeek[dayjs().add(i, "day").day()] }}
                            </v-btn>
                        </div>
                    </div>
                    <div class="timetable__box" id="timetable">
                        <div
                            class="timetable__line"
                            :style="{
                                top: nowTop,
                                width: `${timetables.length * 150}px`,
                            }"
                            v-show="nowTop !== '-1px'"
                        ></div>
                        <div class="timetable__time-bar">
                            <div v-for="h in 25" class="timetable__time-label">
                                {{ h - 1 }}
                            </div>
                        </div>
                        <div
                            v-for="(timetable, i) in timetables"
                            style="width: 150px; flex-shrink: 0; height: 3600px"
                        >
                            <Channel
                                :channel="timetable.channel"
                                :has_bar="i === 0"
                            />
                            <div style="height: 4px"></div>
                            <Program :programs="timetable.programs" />
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
import Channel from "@/components/Timetable/Channel.vue";
import Program from "@/components/Timetable/Program.vue";
import dayjs from "dayjs";

const timetables = ref<ITimetableData[]>([]);

const is_loading = ref(true);
const nowTop = ref("0px");
const target_type = ref<ChannelType>("GR");
const day = ref(dayjs().day()); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日
const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"];

const fetchTimetable = async (type: ChannelType, day: number) => {
    const isToday = day === dayjs().day();
    const hour = isToday ? dayjs().hour() : 0;
    const minute = isToday ? dayjs().minute() : 0;
    const result = await Timetable.fetchTimetable(type, day, hour, minute);
    if (result) timetables.value = result;
    const scrollTo =
        ((dayjs().hour() * 60 + dayjs().minute()) / 25 / 60) * 3600 + 34;
    nowTop.value = isToday ? `${scrollTo}px` : "-1px";
    return result ? result : [];
};
const updateTargetType = (type: ChannelType) => {
    target_type.value = type;
    fetchTimetable(type, day.value);
};
const updateDay = (targetDay: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    day.value = targetDay;
    fetchTimetable(target_type.value, targetDay);
};

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
                const scrollTo =
                    ((dayjs().hour() * 60 + dayjs().minute()) / 25 / 60) *
                        3600 +
                    34;
                nowTop.value = `${scrollTo}px`;
                document.getElementById("timetable")?.scrollTo({
                    left: 0,
                    top: scrollTo - 100,
                });
            }
        })
        .finally(() => {
            is_loading.value = false;
        });
});
</script>

<style lang="scss" scoped>
.timetable-home-container-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0; // very important!!! これがないと要素がはみ出す
    height: 100vh;
    @include smartphone-vertical {
       height: calc(100vh - 65px);
    }
}

.timetable-home-container {
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
.timetable {
    &__loading {
        position: fixed;
        top: calc(50% - 25px);
        left: calc(50% - 25px);
        z-index: 10;
    }
    &__box {
        display: flex;
        overflow-x: scroll;
        width: 100%;
        position: relative;
    }
    &__time-bar {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(25, 144px);
        grid-template-columns: 45px;
        margin-top: 36px;
        margin-right: 5px;
        left: 0px;
        position: sticky;
        background: rgb(var(--v-theme-background-lighten-2));
        text-align: center;
        height: 3600px;
    }

    &__time-label {
        border-bottom: 1px solid rgb(var(--v-theme-text));
    }
    &__line {
        position: absolute;
        left: 45px;
        border-top: 3px solid rgb(var(--v-theme-primary));
    }
}
</style>
