<template>
    <div style="display: flex">
        <div class="timetable__table">
            <div
                v-for="program in programs"
                class="timetable__program"
                v-bind:key="program.id"
                @click="selectProgram(program)"
                :style="
                    getCss(
                        program.width_on_timetable,
                        program.start_time,
                        program.end_time
                    )
                "
            >
                <div>
                    <div class="timetable__program__start-min">
                        {{ dayjs(program.start_time).format("mm") }}
                    </div>
                </div>
                <div class="timetable__program__data">
                    <p class="timetable__program__title" v-html="ProgramUtils.decorateProgramInfo(program, 'title')" />
                    <p class="timetable__program__description" v-html="ProgramUtils.decorateProgramInfo(program, 'description')" /> 
                    <p class="timetable__program__description"  v-for="key in Object.keys(program.detail)"  v-bind:key="key">
                        <span class="timetable__program__detail-title">{{ key }}</span>{{ program.detail[key] }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ITimetableProgram } from '@/services/Timetable';
import { ProgramUtils } from '@/utils';
import { dayjs } from '@/utils';
import { inject, Ref } from 'vue';

const injected = inject<{ selectedProgram: Ref<null | ITimetableProgram>; updateSelectedProgram: (program: ITimetableProgram | null) => void }>('selectedProgram')
const selectProgram = (program:  ITimetableProgram) => injected?.updateSelectedProgram(program)
// Props の定義
const props = defineProps<{
    programs: ITimetableProgram[];
}>();

const getCss = (width: number, start: string, end: string) => {
    const startHour = dayjs(start).hour();
    const startMinute = dayjs(start).minute();
    const endHour = dayjs(end).hour();
    const endMinute = dayjs(end).minute();

    // 1時間を12分割して、5分単位で計算
    const startGrid = startHour * 12 + Math.floor(startMinute / 5);
    const endGridTemp = endHour * 12 + Math.floor(endMinute / 5);
    const endGrid = endGridTemp >= startGrid ? endGridTemp : endGridTemp + 288;
    const gridCss = `grid-area:${startGrid + 1} / 1 / ${endGrid + 1} / 1;`;
    return `width: ${150 * width}px;${gridCss};cursor: pointer;`;
};
</script>

<style lang="scss" scoped>
.timetable {
    &__table {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(300, 12px);
        grid-template-columns: 140px;
        padding-left: 5px;
        padding-right: 5px;
    }
    &__program {
        border: solid 1px rgb(var(--v-theme-text));
        background: rgb(var(--v-theme-background-lighten-1));
        border-radius: 4px;
        padding: 5px;
        overflow: hidden;
        display: flex;
        &__data {
            padding-left: 2px;;
        }
        &__title {
            font-weight: bold;
            color: rgb(var(--v-theme-text));
            font-size: 0.8rem;
        }
        &__start-min {
            background-color: rgb(var(--v-theme-primary));
            padding:2px;
            border-radius: 4px;
        }
        &__description {
            font-size: 0.7rem;
            margin-top: 5px;
        }
        &__detail-title {
           font-weight: bold;
            color: rgb(var(--v-theme-text));
            border: 1px solid rgb(var(--v-theme-text));
        }
    }
}
</style>
