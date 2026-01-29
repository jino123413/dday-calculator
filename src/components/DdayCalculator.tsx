/**
 * 디데이메이트 메인 컴포넌트
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Text, Button, Loader, colors, useDialog, useToast } from '@toss/tds-react-native';

import { useJsonStorage, haptic, useInterstitialAd } from '../hooks';
import {
  DdayItem,
  calculateDday,
  formatDday,
  formatDateKorean,
  getDayOfWeek,
  getTodayISO,
  generateId,
  calculateDaysBetween,
} from '../utils';

const PRIMARY_COLOR = '#7C3AED';
const AD_GROUP_ID = 'AG-FBP3-KRFX';

type Tab = 'list' | 'add' | 'between';

export function DdayCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const { value: ddayList, save: saveDdayList, loading } = useJsonStorage<DdayItem[]>('dday-list', []);
  const { showAd } = useInterstitialAd(AD_GROUP_ID);

  // 새 D-Day 추가 상태
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(getTodayISO());

  // 두 날짜 사이 계산 상태
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [betweenResult, setBetweenResult] = useState<number | null>(null);

  const dialog = useDialog();
  const toast = useToast();

  // D-Day 목록 정렬 (가까운 날짜순)
  const sortedList = useMemo(() => {
    return [...ddayList].sort((a, b) => {
      const ddayA = Math.abs(calculateDday(a.targetDate));
      const ddayB = Math.abs(calculateDday(b.targetDate));
      return ddayA - ddayB;
    });
  }, [ddayList]);

  // 탭 변경
  const handleTabChange = useCallback((tab: Tab) => {
    haptic.tap();
    setActiveTab(tab);
  }, []);

  // D-Day 추가
  const handleAddDday = useCallback(() => {
    if (!newTitle.trim()) {
      toast.open('제목을 입력해주세요');
      return;
    }

    haptic.success();

    const newItem: DdayItem = {
      id: generateId(),
      title: newTitle.trim(),
      targetDate: newDate,
      createdAt: new Date().toISOString(),
    };

    saveDdayList([...ddayList, newItem]);
    setNewTitle('');
    setNewDate(getTodayISO());
    toast.open('D-Day가 추가되었습니다');
    setActiveTab('list');
  }, [newTitle, newDate, ddayList, saveDdayList, toast]);

  // D-Day 삭제
  const handleDeleteDday = useCallback(async (id: string) => {
    const confirmed = await dialog.openConfirm({
      title: '삭제 확인',
      description: '이 D-Day를 삭제하시겠습니까?',
    });

    if (confirmed) {
      haptic.medium();
      const filtered = ddayList.filter(item => item.id !== id);
      saveDdayList(filtered);
      toast.open('삭제되었습니다');
    }
  }, [ddayList, saveDdayList, dialog, toast]);

  // 두 날짜 사이 계산
  const handleCalculateBetween = useCallback(() => {
    haptic.tap();

    showAd({
      onDismiss: () => {
        const days = calculateDaysBetween(startDate, endDate);
        setBetweenResult(days);
      },
    });
  }, [startDate, endDate, showAd]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 탭 헤더 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => handleTabChange('list')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            내 D-Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => handleTabChange('add')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
            추가하기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'between' && styles.activeTab]}
          onPress={() => handleTabChange('between')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'between' && styles.activeTabText]}>
            기간 계산
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'list' && (
          <View style={styles.listContainer}>
            {sortedList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>등록된 D-Day가 없습니다</Text>
                <Text style={styles.emptySubText}>
                  상단의 '추가하기' 탭에서{'\n'}새로운 D-Day를 추가해보세요
                </Text>
              </View>
            ) : (
              sortedList.map(item => {
                const dday = calculateDday(item.targetDate);
                const ddayText = formatDday(dday);
                const isToday = dday === 0;
                const isPast = dday > 0;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.ddayCard}
                    onLongPress={() => handleDeleteDday(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.ddayCardLeft}>
                      <Text style={styles.ddayTitle}>{item.title}</Text>
                      <Text style={styles.ddayDate}>
                        {formatDateKorean(item.targetDate)} ({getDayOfWeek(item.targetDate)})
                      </Text>
                    </View>
                    <View style={[
                      styles.ddayBadge,
                      isToday && styles.ddayBadgeToday,
                      isPast && styles.ddayBadgePast,
                    ]}>
                      <Text style={[
                        styles.ddayBadgeText,
                        isToday && styles.ddayBadgeTextToday,
                        isPast && styles.ddayBadgeTextPast,
                      ]}>
                        {ddayText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            {sortedList.length > 0 && (
              <Text style={styles.hintText}>
                길게 누르면 삭제할 수 있습니다
              </Text>
            )}
          </View>
        )}

        {activeTab === 'add' && (
          <View style={styles.addContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>D-Day 제목</Text>
              <TextInput
                style={styles.textInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="예: 시험일, 생일, 기념일"
                placeholderTextColor={colors.grey400}
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>날짜 선택</Text>
              <TextInput
                style={styles.textInput}
                value={newDate}
                onChangeText={setNewDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.grey400}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />
              <Text style={styles.helperText}>형식: 2025-12-25</Text>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>미리보기</Text>
              <Text style={styles.previewTitle}>{newTitle || '제목 없음'}</Text>
              <Text style={styles.previewDate}>
                {formatDateKorean(newDate)} ({getDayOfWeek(newDate)})
              </Text>
              <Text style={styles.previewDday}>{formatDday(calculateDday(newDate))}</Text>
            </View>

            <Button
              variant="primary"
              size="large"
              onPress={handleAddDday}
              style={styles.addButton}
            >
              D-Day 추가하기
            </Button>
          </View>
        )}

        {activeTab === 'between' && (
          <View style={styles.betweenContainer}>
            <Text style={styles.sectionTitle}>두 날짜 사이 일수 계산</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>시작일</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.grey400}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>종료일</Text>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.grey400}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />
            </View>

            <Button
              variant="primary"
              size="large"
              onPress={handleCalculateBetween}
              style={styles.calculateButton}
            >
              계산하기
            </Button>

            {betweenResult !== null && (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>계산 결과</Text>
                <Text style={styles.resultValue}>{betweenResult.toLocaleString()}일</Text>
                <Text style={styles.resultSub}>
                  {formatDateKorean(startDate)} ~ {formatDateKorean(endDate)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 15,
    color: colors.grey500,
  },
  activeTabText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey600,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.grey400,
    textAlign: 'center',
    lineHeight: 20,
  },
  ddayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grey50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ddayCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  ddayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  ddayDate: {
    fontSize: 13,
    color: colors.grey500,
  },
  ddayBadge: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ddayBadgeToday: {
    backgroundColor: '#EF4444',
  },
  ddayBadgePast: {
    backgroundColor: colors.grey400,
  },
  ddayBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  ddayBadgeTextToday: {
    color: colors.white,
  },
  ddayBadgeTextPast: {
    color: colors.white,
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.grey400,
    textAlign: 'center',
  },
  addContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey700,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.grey900,
    backgroundColor: colors.white,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.grey400,
  },
  previewCard: {
    backgroundColor: colors.grey50,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.grey400,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 14,
    color: colors.grey500,
    marginBottom: 12,
  },
  previewDday: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  addButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  betweenContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grey900,
    marginBottom: 20,
  },
  calculateButton: {
    backgroundColor: PRIMARY_COLOR,
    marginTop: 4,
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: colors.grey50,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: colors.grey400,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  resultSub: {
    fontSize: 13,
    color: colors.grey500,
  },
});
