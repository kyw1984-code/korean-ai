import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Config } from '../constants/Config';

export const ENTITLEMENT_PRO = 'pro';
export const ENTITLEMENT_AD_FREE = 'ad_free';

export const PACKAGE_PRO_MONTHLY = '$rc_monthly';
export const PACKAGE_PRO_YEARLY = '$rc_annual';
export const PACKAGE_AD_FREE = '$rc_lifetime';

export async function initRevenueCat(): Promise<void> {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.OS === 'ios'
    ? Config.revenueCatApiKey.ios
    : Config.revenueCatApiKey.android;

  if (!apiKey) return; // 키 없으면 스킵 (Expo Go 환경 등)

  await Purchases.configure({ apiKey });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(packageId: string): Promise<CustomerInfo | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current;
    if (!offering) return null;

    const pkg = offering.availablePackages.find((p) => p.identifier === packageId);
    if (!pkg) return null;

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: unknown) {
    // 유저가 직접 취소한 경우는 에러 아님
    if ((error as { userCancelled?: boolean }).userCancelled) return null;
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function checkIsPro(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
}

export function checkIsAdFree(customerInfo: CustomerInfo): boolean {
  return (
    customerInfo.entitlements.active[ENTITLEMENT_AD_FREE] !== undefined ||
    checkIsPro(customerInfo)
  );
}
