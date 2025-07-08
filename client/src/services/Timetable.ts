import APIClient from "@/services/APIClient";
import Channels, { ChannelType, IChannel, ILiveChannel } from "@/services/Channels";
import { IProgram } from "@/services/Programs";

/** 番組表番組検索クエリ */

interface ITimetableQuery {
    is_enabled: boolean;
    service_ranges: {
        network_id: number;
        service_id: number;
        transport_stream_id: number | null;
    }[];
    date_ranges: {
        start_day_of_week: number;
        start_hour: number;
        start_minute: number;
        end_day_of_week: number;
        end_hour: number;
        end_minute: number;
    }[];
}

/** 番組表データ */
export interface ITimetableData {
    channel: ILiveChannel;
    programs: IProgram[];
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
        type: ChannelType,
        day: number
    ): Promise<ITimetableData[] | null> {
        const date_range_init = Array.from({ length: 7 }, (_, i) => ({
            start_day_of_week: (day + i) % 7,
            start_hour: 0,
            start_minute: 0,
            end_day_of_week: (day + i) % 7,
            end_hour: 23,
            end_minute: 59,
        }));
        const date_ranges = date_range_init.filter((_, i) => i !== day);
        const channels = await Channels.fetchAllChannels();
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

        return channels[type].map((channel) => ({
            channel,
            programs: response.data.programs.filter(
                (program) =>
                    program.network_id === channel.network_id &&
                    program.service_id === channel.service_id
            ),
        }));
    }
}

export default Timetable;
