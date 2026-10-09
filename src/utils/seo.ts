import { ActiveTab } from '../types';

interface ViewSeoMeta {
  title: string;
  description: string;
}

const VIEW_METAS: Record<ActiveTab, ViewSeoMeta> = {
  landing: {
    title: 'چندبوم (Chandboom) - سامانه هوشمند مدیریت مالی و بودجه‌بندی با هوش مصنوعی',
    description: 'سامانه لوکس و مدرن چندبوم (Chandboom): مدیریت هوشمند دارایی، پیش‌بینی ۳ ماهه جریان نقدینگی با هوش مصنوعی، یادآور اقساط و چک و محاسبه عادلانه دنگ سفر.',
  },
  dashboard: {
    title: 'داشبورد مالی و نمای کلی | چندبوم (Chandboom)',
    description: 'مشاهده مانده موجودی، نسبت مصرف بودجه، تراکنش‌های اخیر و یادآورهای مالی در چندبوم.',
  },
  transactions: {
    title: 'مدیریت و ثبت تراکنش‌ها | چندبوم (Chandboom)',
    description: 'فهرست کامل درآمدها و هزینه‌ها، جستجوی پیشرفته، فیلتر دسته‌بندی و ثبت هوشمند با هوش مصنوعی.',
  },
  goals: {
    title: 'اهداف مالی و برنامه‌ریزی هوشمند | چندبوم (Chandboom)',
    description: 'تعریف اهداف مالی، برآورد امکان‌پذیری با هوش مصنوعی DeepSeek و پیگیری پیشرفت پس‌انداز در چندبوم.',
  },
  analytics: {
    title: 'تحلیل هوشمند و نمودارهای مالی | چندبوم (Chandboom)',
    description: 'نمودارهای دقیق مخارج، مقایسه درآمد و هزینه ماهانه و پیش‌بینی چندماهه دخل و خرج.',
  },
  reminders: {
    title: 'یادآور چک، اقساط و بدهی‌ها | چندبوم (Chandboom)',
    description: 'سیستم هوشمند سررسید بدهی‌ها، چک‌های صیادی و اقساط ماهانه بانکی با اعلان خودکار.',
  },
  dong: {
    title: 'محاسبه دنگ، خرج سفر و فاکتور رستوران | چندبوم (Chandboom)',
    description: 'تقسیم عادلانه هزینه‌های گروهی سفر و فاکتور تفکیک‌شده رستوران با تسویه حساب بهینه.',
  },
  subscription: {
    title: 'خرید و ارتقای اشتراک طلایی پرو | چندبوم (Chandboom)',
    description: 'پلن‌های ویژه طلایی چندبوم همراه با سیستم پرداخت امن کارت به کارت و تایید سریع.',
  },
  support: {
    title: 'مرکز پشتیبانی و تیکت آنلاین | چندبوم (Chandboom)',
    description: 'پشتیبانی آنلاین کاربران جهت راهنمایی مالی، مشکلات فنی و درخواست ویژگی‌ها.',
  },
  settings: {
    title: 'تنظیمات حساب و سقف بودجه | چندبوم (Chandboom)',
    description: 'شخصی‌سازی سقف بودجه ماهانه، تم تاریک/روشن و مدیریت پروفایل مالی.',
  },
  'ai-assistant': {
    title: 'دستیار مالی هوش مصنوعی چندبوم | چندبوم (Chandboom)',
    description: 'دستیار هوش مصنوعی هوشمند جهت استخراج خودکار تراکنش‌ها، پیش‌بینی ۳ ماه آینده و مشاوره مالی.',
  },
};

export function updatePageSeo(tab: ActiveTab): void {
  if (typeof document === 'undefined') return;
  const meta = VIEW_METAS[tab] || VIEW_METAS.dashboard;
  document.title = meta.title;

  let descTag = document.querySelector('meta[name="description"]');
  if (descTag) {
    descTag.setAttribute('content', meta.description);
  }

  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', meta.title);
  }

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content', meta.description);
  }
}
