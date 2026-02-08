
import { Platform } from '../types';
import { drawDesk } from './Desk';
import { drawSofa } from './Sofa';
import { drawArmchair } from './Armchair';
import { drawMeetingTable } from './MeetingTable';
import { drawGenericPlatform } from './Platform';
import { drawFileCabinet } from './FileCabinet';
import { drawMetalRack } from './MetalRack';
import { drawSmallBookShelf } from './SmallBookShelf';
import { drawAirConditioner } from './AirConditioner';
import { drawXerox } from './Xerox';
import { drawVending } from './Vending';
import { drawElectricBox } from './ElectricBox';
import { drawBigTrashcan } from './BigTrashcan';
import { drawBookCabinet } from './BookCabinet';
import { drawCrate } from './Crate';

export const drawPlatform = (ctx: CanvasRenderingContext2D, p: Platform, gameTime: number = 0) => {
    switch (p.type) {
        case 'desk':
            drawDesk(ctx, p);
            break;
        case 'sofa':
            drawSofa(ctx, p);
            break;
        case 'armchair':
            drawArmchair(ctx, p);
            break;
        case 'meeting_table':
            drawMeetingTable(ctx, p);
            break;
        case 'platform':
            drawGenericPlatform(ctx, p);
            break;
        case 'file_cabinet':
            drawFileCabinet(ctx, p);
            break;
        case 'metal_rack':
            drawMetalRack(ctx, p);
            break;
        case 'small_book_shelf':
            drawSmallBookShelf(ctx, p);
            break;
        case 'air_conditioner':
            drawAirConditioner(ctx, p);
            break;
        case 'xerox':
            drawXerox(ctx, p, gameTime);
            break;
        case 'vending':
            drawVending(ctx, p, gameTime);
            break;
        case 'electric_box':
            drawElectricBox(ctx, p);
            break;
        case 'big_trashcan':
            drawBigTrashcan(ctx, p);
            break;
        case 'book_cabinet':
            drawBookCabinet(ctx, p);
            break;
        case 'crate':
            drawCrate(ctx, p);
            break;
        case 'floor':
        default:
            // Пол рисуется отдельно в основном цикле, здесь ничего делать не нужно
            break;
    }
};
