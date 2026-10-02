import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, typography } from './tokens/index.js';

export function Button({ children, variant = 'primary', disabled, style, ...props }: Omit<PressableProps, 'style'> & { children: ReactNode; variant?: 'primary' | 'secondary' | 'quiet'; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.button, styles[`button_${variant}`], disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
      {...props}
    >
      <Text style={[styles.buttonText, variant === 'primary' && styles.buttonTextPrimary]}>{children}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ChartCard({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return <Card><View style={styles.chartCardHeader}><View style={styles.chartCardCopy}><Text style={styles.chartCardTitle}>{title}</Text>{description ? <Text style={styles.emptyDescription}>{description}</Text> : null}</View>{actions}</View>{children}</Card>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  return <View style={[styles.badge, styles[`badge_${tone}`]]}><Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{children}</Text></View>;
}

export function Input({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={[styles.input, error && styles.inputError]} {...props} />
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Toggle({ label, value, onValueChange, disabled }: { label: string; value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }) {
  return <View style={styles.toggle}><Text style={styles.bodyText}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} disabled={disabled} trackColor={{ false: colors.border, true: colors.brand }} thumbColor={colors.white} />
  </View>;
}

export function Select({ label, value, options, onValueChange, disabled }: { label: string; value: string; options: Array<{ label: string; value: string }>; onValueChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return <View style={styles.inputGroup}><Text style={styles.inputLabel}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => setOpen((current) => !current)} style={styles.selectButton}><Text style={styles.bodyText}>{selected?.label ?? 'Seleccionar'}</Text><Text style={styles.selectChevron}>⌄</Text></Pressable>{open ? <View style={styles.selectOptions}>{options.map((option) => <Pressable key={option.value} accessibilityRole="button" onPress={() => { onValueChange(option.value); setOpen(false); }} style={styles.selectOption}><Text style={styles.bodyText}>{option.label}</Text></Pressable>)}</View> : null}</View>;
}

export function Tabs({ items, value, onValueChange }: { items: Array<{ label: string; value: string }>; value: string; onValueChange: (value: string) => void }) {
  return <View accessibilityRole="tablist" style={styles.tabs}>{items.map((item) => <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: value === item.value }} onPress={() => onValueChange(item.value)} style={[styles.tab, value === item.value && styles.tabActive]}><Text style={[styles.tabText, value === item.value && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>;
}

export function Avatar({ name, size = 34 }: { name?: string; size?: number }) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join('') || '?';
  return <View accessibilityRole="image" accessibilityLabel={name ? `Avatar de ${name}` : 'Avatar sin usuario'} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.avatarText}>{initials}</Text></View>;
}

export function StatusBadge({ status, tone }: { status: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  return <Badge tone={tone ?? (status === 'Activo' ? 'success' : status === 'Inactivo' ? 'neutral' : 'warning')}>{status}</Badge>;
}

export function Dropdown({ label, items }: { label: string; items: Array<{ label: string; onPress: () => void; disabled?: boolean }> }) {
  const [open, setOpen] = useState(false);
  return <View style={styles.dropdown}><Button variant="secondary" accessibilityState={{ expanded: open }} onPress={() => setOpen((current) => !current)}>{label}</Button>{open ? <View style={styles.dropdownMenu}>{items.map((item) => <Pressable key={item.label} accessibilityRole="button" disabled={item.disabled} onPress={() => { setOpen(false); item.onPress(); }} style={[styles.dropdownItem, item.disabled && styles.disabled]}><Text style={styles.bodyText}>{item.label}</Text></Pressable>)}</View> : null}</View>;
}

export function Toast({ message, tone = 'neutral', onDismiss }: { message: string; tone?: 'neutral' | 'success' | 'warning' | 'danger'; onDismiss?: () => void }) {
  return <View accessibilityRole="alert" style={[styles.toast, styles[`toast_${tone}`]]}><Text style={styles.toastText}>{message}</Text>{onDismiss ? <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onDismiss}><Text style={styles.toastDismiss}>×</Text></Pressable> : null}</View>;
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.tooltipAnchor}><Pressable accessibilityLabel={label} onHoverIn={() => setVisible(true)} onHoverOut={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)} onLongPress={() => setVisible((current) => !current)}>{children}</Pressable>{visible ? <View accessibilityRole="tooltip" style={styles.tooltip}><Text style={styles.tooltipText}>{label}</Text></View> : null}</View>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <View style={styles.emptyState}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>A</Text></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyDescription}>{description}</Text>{action}</View>;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyLabel = 'No hay registros para mostrar',
  loading = false,
  error,
  onRetry,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  renderActions
}: {
  columns: Array<{ key: keyof T; label: string; render?: (row: T) => ReactNode }>;
  rows: T[];
  emptyLabel?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  renderActions?: (row: T) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalizedQuery
      ? rows.filter((row) => columns.some((column) => String(row[column.key] ?? '').toLocaleLowerCase().includes(normalizedQuery)))
      : [...rows];
    if (!sortKey) return filtered;
    return filtered.sort((left, right) => {
      const leftValue = String(left[sortKey] ?? '').toLocaleLowerCase();
      const rightValue = String(right[sortKey] ?? '').toLocaleLowerCase();
      return leftValue.localeCompare(rightValue, undefined, { numeric: true }) * (sortDirection === 'asc' ? 1 : -1);
    });
  }, [columns, query, rows, sortDirection, sortKey]);
  const pageCount = Math.ceil(filteredRows.length / pageSize);
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) return <LoadingState label="Cargando registros" />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (!rows.length) return <EmptyState title={emptyLabel} description="Cuando existan registros, aparecerán en esta tabla." />;

  function updateSelection(id: string, checked: boolean) {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? [...new Set([...selectedIds, id])] : selectedIds.filter((selectedId) => selectedId !== id));
  }

  function updatePageSelection(checked: boolean) {
    if (!onSelectionChange) return;
    const visibleIds = new Set(visibleRows.map((row) => row.id));
    onSelectionChange(checked ? [...new Set([...selectedIds, ...visibleIds])] : selectedIds.filter((id) => !visibleIds.has(id)));
  }

  return (
    <View style={styles.tableContainer}>
      <SearchInput label="Buscar en la tabla" value={query} onChangeText={(value) => { setQuery(value); setPage(0); }} />
      {filteredRows.length === 0 ? <EmptyState title="Sin resultados" description="Prueba con otro término de búsqueda." /> : <>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              {selectable ? <View style={[styles.tableCell, styles.selectionCell]}><Checkbox label="Seleccionar filas visibles" checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))} onChange={updatePageSelection} /></View> : null}
              {columns.map((column) => <Pressable key={String(column.key)} accessibilityRole="button" accessibilityLabel={`Ordenar por ${column.label}`} onPress={() => { setSortDirection(sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc'); setSortKey(column.key); }} style={[styles.tableHeaderButton, { minWidth: 150 }]}><Text style={styles.tableHeader}>{column.label}{sortKey === column.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</Text></Pressable>)}
              {renderActions ? <Text style={[styles.tableHeader, styles.actionsCell]}>Acciones</Text> : null}
            </View>
            {visibleRows.map((row) => <View key={row.id} style={styles.tableRow}>
              {selectable ? <View style={[styles.tableCell, styles.selectionCell]}><Checkbox label={`Seleccionar ${row.id}`} checked={selectedIds.includes(row.id)} onChange={(checked) => updateSelection(row.id, checked)} /></View> : null}
              {columns.map((column) => <View key={String(column.key)} style={[styles.tableCell, { minWidth: 150 }]}>{column.render ? column.render(row) : <Text style={styles.bodyText}>{String(row[column.key] ?? '')}</Text>}</View>)}
              {renderActions ? <View style={[styles.tableCell, styles.actionsCell]}>{renderActions(row)}</View> : null}
            </View>)}
          </View>
        </ScrollView>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </>}
    </View>
  );
}

export function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  return <View style={styles.pagination}><Text style={styles.paginationLabel}>{pageCount ? `Página ${page + 1} de ${pageCount}` : 'Sin páginas'}</Text><View style={styles.paginationActions}><Button variant="secondary" disabled={page <= 0} onPress={() => onPageChange(Math.max(0, page - 1))}>Anterior</Button><Button variant="secondary" disabled={page + 1 >= pageCount} onPress={() => onPageChange(Math.min(pageCount - 1, page + 1))}>Siguiente</Button></View></View>;
}

export function SearchInput(props: TextInputProps & { label?: string }) {
  const { label = 'Buscar', ...inputProps } = props;
  return <View style={styles.searchInput}><TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor={colors.textMuted} style={styles.searchTextInput} {...inputProps} /></View>;
}

export function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => onChange(!checked)} style={styles.checkboxRow}><View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked ? <Text style={styles.checkboxMark}>✓</Text> : null}</View><Text style={styles.bodyText}>{label}</Text></Pressable>;
}

export function LoadingState({ label = 'Cargando' }: { label?: string }) {
  return <View accessibilityRole="progressbar" style={styles.loadingState}><View style={styles.loadingBar} /><Text style={styles.emptyDescription}>{label}</Text></View>;
}

export function Skeleton({ width = '100%', height = 18 }: { width?: number | `${number}%`; height?: number }) {
  return <View accessibilityRole="progressbar" style={[styles.skeleton, { width, height }]} />;
}

export function ErrorState({ title = 'No se pudo cargar', description, onRetry }: { title?: string; description: string; onRetry?: () => void }) {
  return <View style={styles.errorState}><Text style={styles.errorTitle}>{title}</Text><Text style={styles.emptyDescription}>{description}</Text>{onRetry ? <Button variant="secondary" onPress={onRetry}>Reintentar</Button> : null}</View>;
}

export function Dialog({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  return (
    <NativeModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar diálogo" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityRole="dialog" style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>{children}
        </View>
      </View>
    </NativeModal>
  );
}

export function PageHeader({ title, description, eyebrow }: { title: string; description?: string; eyebrow?: string }) {
  return <View style={styles.pageHeader}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>{description ? <Text style={styles.pageDescription}>{description}</Text> : null}</View>;
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return <View accessibilityRole="list" style={styles.breadcrumbs}>{items.map((item, index) => <Text key={`${item}-${index}`} accessibilityRole="listitem" style={[styles.breadcrumb, index === items.length - 1 && styles.breadcrumbCurrent]}>{index > 0 ? ' / ' : ''}{item}</Text>)}</View>;
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: radius.md, justifyContent: 'center', minHeight: 40, paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  button_primary: { backgroundColor: colors.brand }, button_secondary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }, button_quiet: { backgroundColor: 'transparent' },
  buttonText: { color: colors.text, fontFamily: typography.familyMedium, fontSize: typography.size.sm }, buttonTextPrimary: { color: colors.white }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.82 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing[5], ...shadows.subtle },
  chartCardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between', marginBottom: spacing[5] }, chartCardCopy: { flex: 1, gap: spacing[1] }, chartCardTitle: { color: colors.text, fontFamily: typography.familyBold, fontSize: typography.size.md },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing[2], paddingVertical: 3 }, badge_neutral: { backgroundColor: colors.surfaceMuted }, badge_success: { backgroundColor: '#e8f3ed' }, badge_warning: { backgroundColor: '#fbf1df' }, badge_danger: { backgroundColor: '#f9eae8' }, badge_accent: { backgroundColor: colors.accentSoft },
  badgeText: { fontFamily: typography.familyMedium, fontSize: typography.size.xs }, badgeText_neutral: { color: colors.textMuted }, badgeText_success: { color: colors.success }, badgeText_warning: { color: colors.warning }, badgeText_danger: { color: colors.danger }, badgeText_accent: { color: colors.accent },
  inputGroup: { gap: spacing[2] }, inputLabel: { color: colors.text, fontFamily: typography.familyMedium, fontSize: typography.size.sm }, input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontFamily: typography.family, fontSize: typography.size.md, minHeight: 42, paddingHorizontal: spacing[3], paddingVertical: spacing[2] }, inputError: { borderColor: colors.danger }, errorText: { color: colors.danger, fontSize: typography.size.xs },
  toggle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44 }, bodyText: { color: colors.text, fontFamily: typography.family, fontSize: typography.size.sm },
  emptyState: { alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[6], paddingVertical: spacing[10] }, emptyMark: { alignItems: 'center', backgroundColor: colors.brandSoft, borderRadius: 18, height: 44, justifyContent: 'center', width: 44 }, emptyMarkText: { color: colors.brand, fontFamily: typography.familyBold, fontSize: typography.size.lg }, emptyTitle: { color: colors.text, fontFamily: typography.familyBold, fontSize: typography.size.lg, textAlign: 'center' }, emptyDescription: { color: colors.textMuted, fontFamily: typography.family, fontSize: typography.size.sm, lineHeight: typography.lineHeight.normal, maxWidth: 420, textAlign: 'center' },
  tableContainer: { gap: spacing[3] }, table: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' }, tableRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 48 }, tableHeaderButton: { alignItems: 'flex-start', justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing[3] }, tableHeader: { color: colors.textMuted, fontFamily: typography.familyBold, fontSize: typography.size.xs, textTransform: 'uppercase' }, tableCell: { justifyContent: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2] }, selectionCell: { minWidth: 44, paddingHorizontal: spacing[2] }, actionsCell: { minWidth: 110, paddingHorizontal: spacing[3] },
  pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }, paginationLabel: { color: colors.textMuted, fontSize: typography.size.xs }, paginationActions: { flexDirection: 'row', gap: spacing[2] },
  searchInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing[3] }, searchTextInput: { color: colors.text, fontFamily: typography.family, fontSize: typography.size.sm, padding: 0 },
  selectButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingHorizontal: spacing[3] }, selectChevron: { color: colors.textMuted, fontSize: typography.size.lg }, selectOptions: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing[1], overflow: 'hidden' }, selectOption: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing[3] },
  tabs: { alignSelf: 'flex-start', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: 'row', gap: 2, padding: 3 }, tab: { alignItems: 'center', borderRadius: radius.sm, justifyContent: 'center', minHeight: 34, paddingHorizontal: spacing[3] }, tabActive: { backgroundColor: colors.surface, boxShadow: '0px 1px 3px rgba(27, 44, 36, 0.08)' }, tabText: { color: colors.textMuted, fontSize: typography.size.sm }, tabTextActive: { color: colors.text, fontFamily: typography.familyMedium },
  avatar: { alignItems: 'center', backgroundColor: colors.brandSoft, justifyContent: 'center' }, avatarText: { color: colors.brand, fontFamily: typography.familyBold, fontSize: typography.size.xs },
  dropdown: { alignSelf: 'flex-start', position: 'relative' }, dropdownMenu: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minWidth: 170, padding: spacing[1], position: 'absolute', right: 0, top: '100%', zIndex: 10, ...shadows.popover }, dropdownItem: { borderRadius: radius.sm, minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing[3] },
  toast: { alignItems: 'center', borderRadius: radius.md, flexDirection: 'row', gap: spacing[4], justifyContent: 'space-between', maxWidth: 460, paddingHorizontal: spacing[4], paddingVertical: spacing[3] }, toast_neutral: { backgroundColor: colors.text }, toast_success: { backgroundColor: colors.success }, toast_warning: { backgroundColor: colors.warning }, toast_danger: { backgroundColor: colors.danger }, toastText: { color: colors.white, flex: 1, fontSize: typography.size.sm }, toastDismiss: { color: colors.white, fontSize: typography.size.lg },
  tooltipAnchor: { alignSelf: 'flex-start', position: 'relative' }, tooltip: { backgroundColor: colors.text, borderRadius: radius.sm, bottom: '100%', left: 0, maxWidth: 240, paddingHorizontal: spacing[2], paddingVertical: spacing[1], position: 'absolute', zIndex: 20 }, tooltipText: { color: colors.white, fontSize: typography.size.xs },
  checkboxRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[2], minHeight: 40 }, checkbox: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1 }, checkboxChecked: { borderColor: colors.brand, backgroundColor: colors.brand }, checkboxMark: { color: colors.white, fontSize: 12, fontWeight: '700' },
  loadingState: { alignItems: 'center', gap: spacing[3], padding: spacing[8] }, loadingBar: { width: 120, height: 4, borderRadius: radius.pill, backgroundColor: colors.brandSoft }, errorState: { alignItems: 'center', gap: spacing[3], padding: spacing[6] }, errorTitle: { color: colors.danger, fontFamily: typography.familyBold, fontSize: typography.size.md },
  skeleton: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  modalBackdrop: { alignItems: 'center', backgroundColor: colors.overlay, flex: 1, justifyContent: 'center', padding: spacing[5] }, modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, maxWidth: 520, padding: spacing[6], width: '100%', ...shadows.popover }, modalTitle: { color: colors.text, fontFamily: typography.familyBold, fontSize: typography.size.lg, marginBottom: spacing[4] },
  pageHeader: { gap: spacing[2] }, eyebrow: { color: colors.accent, fontFamily: typography.familyBold, fontSize: typography.size.xs, textTransform: 'uppercase' }, pageTitle: { color: colors.text, fontFamily: typography.familyBold, fontSize: typography.size.display }, pageDescription: { color: colors.textMuted, fontFamily: typography.family, fontSize: typography.size.md, lineHeight: typography.lineHeight.relaxed }, breadcrumbs: { flexDirection: 'row' }, breadcrumb: { color: colors.textMuted, fontFamily: typography.family, fontSize: typography.size.xs }, breadcrumbCurrent: { color: colors.text }
});
