export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const formatTimeVN = (value?: string | null) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: VN_TIME_ZONE,
  });
};

export const formatDateVN = (value?: string | null) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });
};

export const formatDateTimeVN = (value?: string | null) => {
  if (!value) return '';

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
    timeZone: VN_TIME_ZONE,
  });
};

export const formatConversationTimeVN = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;

  return formatDateVN(value);
};

export const formatNotificationTimeVN = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDateVN(value);
};

export const formatDateSeparatorVN = (value: string) => {
  const dateText = new Date(value).toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });

  const todayText = new Date().toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayText = yesterday.toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });

  if (dateText === todayText) return 'Hôm nay';
  if (dateText === yesterdayText) return 'Hôm qua';

  return dateText;
};

export const isDifferentDayVN = (
  previousValue?: string | null,
  currentValue?: string | null
) => {
  if (!previousValue || !currentValue) return true;

  const previousDate = new Date(previousValue).toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });

  const currentDate = new Date(currentValue).toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
  });

  return previousDate !== currentDate;
};