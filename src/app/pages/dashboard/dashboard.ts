import { Component } from '@angular/core';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';

@Component({
    selector: 'p-dashboard',
    imports: [StatsWidget, RecentSalesWidget, BestSellingWidget, RevenueStreamWidget, NotificationsWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <p-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <p-recent-sales-widget />
                <p-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <p-revenue-stream-widget />
                <p-notifications-widget />
            </div>
        </div>
    `
})
export class Dashboard {}
