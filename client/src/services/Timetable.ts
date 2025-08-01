import APIClient from "@/services/APIClient";
import Channels, {
    ChannelType,
    ILiveChannel,
    ILiveChannelsList,
} from "@/services/Channels";
import { IProgram } from "@/services/Programs";
import { dayjs } from "@/utils";

interface IDateRange {
    start_day_of_week: number;
    start_hour: number;
    start_minute: number;
    end_day_of_week: number;
    end_hour: number;
    end_minute: number;
}

/** 番組表番組検索クエリ */

interface ITimetableQuery {
    is_enabled: boolean;
    service_ranges: {
        network_id: number;
        service_id: number;
        transport_stream_id: number | null;
    }[];
    date_ranges: IDateRange[];
    is_exclude_date_ranges: true;
}

/** 番組表データ */
export interface ITimetableData {
    channel: ILiveChannel;
    programs: ITimetableProgram[];
}

/** 番組表向け拡張番組データ */
export interface ITimetableProgram extends IProgram {
    width_on_timetable: number; // 1～
}

/**
 * 時刻表現形式を比較可能なUnix時間に変換する
 * @returns Unix時間（秒単位）
 */
function toUnix(date: string) {
    return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * 録画予約に関する API 操作を提供するクラス
 */
class Timetable {
    /**
     * 番組表を取得する
     * @returns 番組のリスト、取得失敗時は null
     */
    static async fetchTimetable(
        channels: ILiveChannelsList,
        type: ChannelType,
        day: number,
        hour?: number,
        minute?: number,
        isToday?: boolean
    ): Promise<ITimetableData[] | null> {
        const date_range_init: IDateRange[] = Array.from(
            { length: 7 },
            (_, i) => ({
                start_day_of_week: (day + i) % 7,
                start_hour: 0,
                start_minute: 0,
                end_day_of_week: (day + i) % 7,
                end_hour: 23,
                end_minute: 59,
            })
        );
        const date_ranges_filtered = date_range_init.filter(
            (d, i) => d.start_day_of_week !== day
        );
        const date_ranges = date_ranges_filtered;
        if (!channels) return null;
        const service_ranges = (channels ? channels[type] : []).map((c) => ({
            network_id: c.network_id,
            service_id: c.service_id,
            transport_stream_id: c.transport_stream_id,
        }));
        const query: ITimetableQuery = {
            is_enabled: true,
            service_ranges,
            date_ranges,
            is_exclude_date_ranges: true,
        };
        const response = await APIClient.post<{ programs: IProgram[] }>(
            "/programs/search",
            query
        );

        if (response.type === "error") {
            APIClient.showGenericError(
                response,
                "番組一覧を取得できませんでした。"
            );
            return null;
        }
        const programs = isToday ? response.data.programs.filter((p) => dayjs(p.start_time).date() === dayjs().date()) : response.data.programs;

        return channels[type].map((channel, ch_index) => ({
            channel,
            programs: programs
                .filter(
                    (program) =>
                        !!program.title && program.channel_id === channel.id
                )
                .map((program) => {
                    const programsWithOutSameChannel = programs.filter(
                        (p) => p.channel_id !== channel.id
                    );
                    let width = 1; // 初期幅は1
                    for (let i = 1; i < 10; i++) {
                        // サブチャンネルは10個まで許容
                        const subCh = channels[type][ch_index + i];
                        if (
                            !subCh ||
                            subCh.transport_stream_id !==
                                channel.transport_stream_id
                        )
                            break;
                        const subChProgsDuplicated =
                            programsWithOutSameChannel.find(
                                (sProg) =>
                                    !!sProg.title &&
                                    sProg.channel_id === subCh.id &&
                                    toUnix(sProg.start_time) <
                                        toUnix(program.end_time) &&
                                    toUnix(program.start_time) <
                                        toUnix(sProg.end_time)
                            );
                        if (!subChProgsDuplicated) {
                            width++;
                        } else {
                            break; // サブチャンネルが重複しない場合は終了
                        }
                    }
                    return {
                        ...program,
                        width_on_timetable: width
                    };
                }),
        }));
    }
}

export default Timetable;
