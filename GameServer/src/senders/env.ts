import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export enum EnvMessageType {
    TaxChange,
    Weather,
    Time,
}

interface TaxChangeData {
    subType: EnvMessageType.TaxChange;
    zoneId: number;
    sellRate: number;
    buyRate: number;
}

interface WeatherData {
    subType: EnvMessageType.Weather;
    weather: number;
}

interface TimeData {
    subType: EnvMessageType.Time;
    year: number;
    month: number;
    day: number;
    hour: number;
    startTime: number;
}

type EnvMessageData = TaxChangeData | WeatherData | TimeData;

export default function (session: Session<SendersType>) {
    return (data: EnvMessageData) => {
        const msg = new Message({ type: _messages.MSG_ENV, subType: data.subType });

        switch (data.subType) {
            case EnvMessageType.TaxChange:
                msg.write('i32>', data.zoneId);
                msg.write('i32>', data.sellRate);
                msg.write('i32>', data.buyRate);
                break;
            case EnvMessageType.Weather:
                msg.write('u8', data.weather);
                break;
            case EnvMessageType.Time:
                msg.write('i32>', data.year);
                msg.write('u8', data.month);
                msg.write('u8', data.day);
                msg.write('u8', data.hour);
                msg.write('i32>', data.startTime);
                break;
        }

        session.write(msg.build());
    }
}
