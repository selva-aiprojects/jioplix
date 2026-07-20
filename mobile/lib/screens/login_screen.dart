import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'role_dashboard_router.dart';
import 'patient_dashboard_screen.dart';
import 'patient_auth_screen.dart';

// Provider to fetch tenants from the database
final tenantsProvider = FutureProvider<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getPublicTenants();
  return response.data as List<dynamic>;
});

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with TickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _selectedFacilityId;
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  late AnimationController _formController;
  late Animation<Offset> _facilitySlide;
  late Animation<Offset> _emailSlide;
  late Animation<Offset> _passwordSlide;
  late Animation<Offset> _buttonSlide;
  late Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    _formController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeIn = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _formController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _facilitySlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _formController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOutCubic),
    ));

    _emailSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _formController,
      curve: const Interval(0.15, 0.6, curve: Curves.easeOutCubic),
    ));

    _passwordSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _formController,
      curve: const Interval(0.3, 0.7, curve: Curves.easeOutCubic),
    ));

    _buttonSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _formController,
      curve: const Interval(0.45, 0.85, curve: Curves.easeOutCubic),
    ));

    _formController.forward();
  }

  @override
  void dispose() {
    _formController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_selectedFacilityId == null) {
      setState(() => _errorMessage = 'Please select a facility');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    HapticFeedback.mediumImpact();

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.login(
        _emailController.text,
        _passwordController.text,
        _selectedFacilityId!,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token']);
        await prefs.setString('tenant_id', data['tenantId']);
        await prefs.setString('user_role', data['role'] ?? 'doctor');
        await prefs.setString('user_name', data['userName'] ?? 'User');
        await prefs.setBool('is_manager', data['isManager'] == true);
        if (data['userId'] != null) {
          await prefs.setString('user_id', data['userId'].toString());
        }

        if (mounted) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => const RoleDashboardRouter(),
              transitionDuration: const Duration(milliseconds: 500),
              transitionsBuilder: (_, animation, __, child) {
                return FadeTransition(
                  opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
                  child: child,
                );
              },
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Login failed. Please check your credentials.';
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showFacilitySelector(List<dynamic> tenants) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.6,
          ),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXxl)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text(
                  'Select Medical Facility',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: tenants.length,
                  itemBuilder: (context, index) {
                    final tenant = tenants[index];
                    final tenantId = tenant['id'].toString();
                    final isSelected = _selectedFacilityId == tenantId;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _selectedFacilityId = tenantId);
                            Navigator.pop(context);
                          },
                          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primarySurface
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    gradient: isSelected
                                        ? AppColors.primaryGradient
                                        : null,
                                    color: isSelected
                                        ? null
                                        : AppColors.background,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.local_hospital_rounded,
                                    color: isSelected
                                        ? Colors.white
                                        : AppColors.primary,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    tenant['name'].toString(),
                                    style: TextStyle(
                                      fontWeight: isSelected
                                          ? FontWeight.w800
                                          : FontWeight.w600,
                                      fontSize: 15,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                Icon(
                                  isSelected
                                      ? Icons.check_circle_rounded
                                      : Icons.chevron_right_rounded,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.textHint,
                                  size: 22,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final tenantsAsync = ref.watch(tenantsProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF), Color(0xFFF8FAFC)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.0, 0.5, 1.0],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── Logo + Brand ──────────────────────────────────────
                  FadeTransition(
                    opacity: _fadeIn,
                    child: Column(
                      children: [
                        // Logo with glow
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.12),
                                blurRadius: 40,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Image.asset(
                            'assets/logo.png',
                            height: 56,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.health_and_safety_rounded,
                              size: 56,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'Healthezee HIMS',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Clinical Operations Portal',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primaryDark,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // ── Glassmorphism Login Card ──────────────────────────
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppTheme.radiusXxl),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.surface.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(AppTheme.radiusXxl),
                          border: Border.all(
                            color: AppColors.border.withValues(alpha: 0.5),
                          ),
                          boxShadow: AppTheme.shadowProminent,
                        ),
                        child: Column(
                          children: [
                            // Facility Selector
                            SlideTransition(
                              position: _facilitySlide,
                              child: FadeTransition(
                                opacity: _fadeIn,
                                child: tenantsAsync.when(
                                  data: (tenants) {
                                    if (_selectedFacilityId == null &&
                                        tenants.isNotEmpty) {
                                      _selectedFacilityId =
                                          tenants.first['id'].toString();
                                    }
                                    final selectedTenantName =
                                        tenants.firstWhere(
                                      (t) =>
                                          t['id'].toString() ==
                                          _selectedFacilityId,
                                      orElse: () => {'name': 'Select Facility'},
                                    )['name'].toString();

                                    return _buildFacilityButton(
                                      selectedTenantName,
                                      false,
                                      () => _showFacilitySelector(tenants),
                                    );
                                  },
                                  loading: () => const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ),
                                  error: (err, stack) {
                                    final offlineTenants = [
                                      {'id': '1', 'name': 'City Clinic'},
                                      {
                                        'id': '2',
                                        'name': 'Metropolis Diagnostics'
                                      },
                                    ];
                                    if (_selectedFacilityId == null) {
                                      _selectedFacilityId = '1';
                                    }
                                    final selectedTenantName =
                                        offlineTenants.firstWhere(
                                      (t) => t['id'] == _selectedFacilityId,
                                      orElse: () => {'name': 'City Clinic'},
                                    )['name']!;

                                    return _buildFacilityButton(
                                      selectedTenantName,
                                      true,
                                      () => _showFacilitySelector(
                                          offlineTenants),
                                    );
                                  },
                                ),
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Email
                            SlideTransition(
                              position: _emailSlide,
                              child: TextField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                ),
                                decoration: const InputDecoration(
                                  labelText: 'Email Address',
                                  prefixIcon: Icon(Icons.email_outlined,
                                      color: AppColors.textMuted, size: 20),
                                ),
                              ),
                            ),

                            const SizedBox(height: 14),

                            // Password with visibility toggle
                            SlideTransition(
                              position: _passwordSlide,
                              child: TextField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                ),
                                decoration: InputDecoration(
                                  labelText: 'Password',
                                  prefixIcon: const Icon(
                                      Icons.lock_outline_rounded,
                                      color: AppColors.textMuted,
                                      size: 20),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined,
                                      color: AppColors.textHint,
                                      size: 20,
                                    ),
                                    onPressed: () => setState(
                                      () => _obscurePassword =
                                          !_obscurePassword,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            // Error message
                            if (_errorMessage != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.errorSurface,
                                  borderRadius: BorderRadius.circular(
                                      AppTheme.radiusMd),
                                  border:
                                      Border.all(color: AppColors.errorLight),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline_rounded,
                                        color: AppColors.error, size: 18),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorMessage!,
                                        style: const TextStyle(
                                          color: AppColors.error,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 24),

                            // Sign In Button
                            SlideTransition(
                              position: _buttonSlide,
                              child: SizedBox(
                                width: double.infinity,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  child: ElevatedButton(
                                    onPressed:
                                        _isLoading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 18),
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shadowColor: AppColors.primary
                                          .withValues(alpha: 0.3),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            AppTheme.radiusLg),
                                      ),
                                    ),
                                    child: _isLoading
                                        ? const SizedBox(
                                            height: 20,
                                            width: 20,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2.5,
                                            ),
                                          )
                                        : const Text(
                                            'SIGN IN',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(height: 12),

                            // Patient View Button
                            SlideTransition(
                              position: _buttonSlide,
                              child: SizedBox(
                                width: double.infinity,
                                child: OutlinedButton(
                                  onPressed: () async {
                                    HapticFeedback.selectionClick();
                                    final prefs = await SharedPreferences.getInstance();
                                    final patientId = prefs.getString('patient_id');
                                    if (!context.mounted) return;
                                    Navigator.pushReplacement(
                                      context,
                                      PageRouteBuilder(
                                        pageBuilder: (_, __, ___) =>
                                            patientId == null
                                                ? const PatientAuthScreen()
                                                : const PatientDashboardScreen(),
                                        transitionDuration:
                                            const Duration(milliseconds: 400),
                                        transitionsBuilder:
                                            (_, animation, __, child) {
                                          return FadeTransition(
                                            opacity: animation,
                                            child: child,
                                          );
                                        },
                                      ),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 16),
                                    side: const BorderSide(
                                        color: AppColors.border),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                          AppTheme.radiusLg),
                                    ),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.person_outline_rounded,
                                          size: 18,
                                          color: AppColors.textTertiary),
                                      SizedBox(width: 8),
                                      Text(
                                        'PATIENT PORTAL',
                                        style: TextStyle(
                                          color: AppColors.textTertiary,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Footer
                  FadeTransition(
                    opacity: _fadeIn,
                    child: const Text(
                      'Powered by Healthezee HIMS v1.0',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textHint,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFacilityButton(
    String name,
    bool isOffline,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isOffline
                      ? AppColors.amberSurface
                      : AppColors.primarySurface,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isOffline
                      ? Icons.cloud_off_rounded
                      : Icons.business_rounded,
                  color: isOffline ? AppColors.amber : AppColors.primary,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isOffline ? 'FACILITY (OFFLINE)' : 'ACTIVE FACILITY',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textHint,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textHint),
            ],
          ),
        ),
      ),
    );
  }
}
