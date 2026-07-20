import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'patient_dashboard_screen.dart';
import 'login_screen.dart';

final patientTenantsProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getPublicTenants();
  return response.data as List<dynamic>;
});

class PatientAuthScreen extends ConsumerStatefulWidget {
  const PatientAuthScreen({super.key});

  @override
  ConsumerState<PatientAuthScreen> createState() => _PatientAuthScreenState();
}

class _PatientAuthScreenState extends ConsumerState<PatientAuthScreen> {
  bool _isSignUp = false;
  final _loginQueryController = TextEditingController();
  final _signUpNameController = TextEditingController();
  final _signUpPhoneController = TextEditingController();
  final _signUpEmailController = TextEditingController();
  final _signUpAbhaController = TextEditingController();
  final _signUpDobController = TextEditingController();

  String? _selectedFacilityId;
  String _signUpGender = 'Male';
  DateTime? _signUpDob;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _loginQueryController.dispose();
    _signUpNameController.dispose();
    _signUpPhoneController.dispose();
    _signUpEmailController.dispose();
    _signUpAbhaController.dispose();
    _signUpDobController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 30)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _signUpDob = picked;
        _signUpDobController.text =
            "${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}";
      });
    }
  }

  Future<void> _handlePatientLookup() async {
    final query = _loginQueryController.text.trim();
    if (query.isEmpty) {
      setState(() => _errorMessage = 'Enter your Phone Number or Patient MRN');
      return;
    }
    if (_selectedFacilityId == null) {
      setState(() => _errorMessage = 'Please select a facility/hospital');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    HapticFeedback.mediumImpact();

    try {
      final api = ref.read(apiServiceProvider);
      final prefs = await SharedPreferences.getInstance();

      // Temporarily set tenant ID to route lookup query to the correct database shard
      await prefs.setString('tenant_id', _selectedFacilityId!);

      final searchRes = await api.searchPatients(query);
      final list = searchRes.data;

      if (list is List && list.isNotEmpty) {
        final patient = list.firstWhere(
          (p) =>
              p['phone']?.toString().contains(query) == true ||
              p['mrn']?.toString().toLowerCase() == query.toLowerCase(),
          orElse: () => list.first,
        );

        await prefs.setString('patient_id', patient['id'].toString());
        await prefs.setString('patient_name', patient['name'].toString());
        await prefs.setString('patient_phone', patient['phone']?.toString() ?? '');
        await prefs.setString('user_role', 'patient');

        if (mounted) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => const PatientDashboardScreen(),
              transitionDuration: const Duration(milliseconds: 500),
              transitionsBuilder: (_, animation, __, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          );
        }
      } else {
        setState(() => _errorMessage =
            'No patient record found in this hospital with that search query. Please switch to register.');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Lookup failed: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handlePatientRegister() async {
    final name = _signUpNameController.text.trim();
    final phone = _signUpPhoneController.text.trim();
    final email = _signUpEmailController.text.trim();
    final abhaId = _signUpAbhaController.text.trim();

    if (name.isEmpty || phone.isEmpty) {
      setState(() => _errorMessage = 'Name and Phone number are required');
      return;
    }
    if (_selectedFacilityId == null) {
      setState(() => _errorMessage = 'Please select a facility/hospital');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    HapticFeedback.mediumImpact();

    try {
      final api = ref.read(apiServiceProvider);
      final prefs = await SharedPreferences.getInstance();

      // Route creation request to the selected hospital database schema shard
      await prefs.setString('tenant_id', _selectedFacilityId!);

      final dobStr = _signUpDob != null
          ? "${_signUpDob!.year}-${_signUpDob!.month.toString().padLeft(2, '0')}-${_signUpDob!.day.toString().padLeft(2, '0')}"
          : null;

      int age = 0;
      if (_signUpDob != null) {
        age = DateTime.now().year - _signUpDob!.year;
      }

      final regRes = await api.registerPatient({
        'name': name,
        'phone': phone,
        'email': email,
        'gender': _signUpGender,
        'age': age,
        'dob': dobStr,
        'abhaId': abhaId,
        'abhaStatus': '',
        'abhaVerified': false,
      });

      final patient = regRes.data;
      if (patient is Map && patient['id'] != null) {
        await prefs.setString('patient_id', patient['id'].toString());
        await prefs.setString('patient_name', patient['name'].toString());
        await prefs.setString('patient_phone', patient['phone']?.toString() ?? '');
        await prefs.setString('user_role', 'patient');

        if (mounted) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => const PatientDashboardScreen(),
              transitionDuration: const Duration(milliseconds: 500),
              transitionsBuilder: (_, animation, __, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          );
        }
      } else {
        setState(() => _errorMessage = 'Registration failed. Backend returned empty response.');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Registration failed: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isLoading = false);
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
                  'Select Hospital / Facility',
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

  Widget _buildGenderChip(String label) {
    final isSelected = _signUpGender == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: AppColors.primarySurface,
        backgroundColor: Colors.white,
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textTertiary,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
        checkmarkColor: AppColors.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          side: BorderSide(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        onSelected: (v) {
          if (v) {
            setState(() => _signUpGender = label);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tenantsAsync = ref.watch(patientTenantsProvider);

    return Scaffold(
      backgroundColor: AppColors.surfaceVariant,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF), Color(0xFFECFDF5)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.0, 0.6, 1.0],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header Row (Back + Title)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary, size: 20),
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Patient Portal Onboarding',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                  child: Column(
                    children: [
                      // Header Logo & Branding
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.1),
                              blurRadius: 30,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.health_and_safety_rounded,
                          size: 50,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Healthezee HIMS',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Access clinical schedules & manage digital health records',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Hospital Selector Dropdown Card
                      Container(
                        decoration: AppTheme.cardDecoration(
                          shadow: AppTheme.shadowSubtle,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: tenantsAsync.when(
                            data: (tenants) {
                              if (_selectedFacilityId == null && tenants.isNotEmpty) {
                                _selectedFacilityId = tenants.first['id'].toString();
                              }
                              final activeName = tenants.firstWhere(
                                (t) => t['id'].toString() == _selectedFacilityId,
                                orElse: () => {'name': 'Select Hospital'},
                              )['name'].toString();

                              return _buildFacilitySelectorButton(activeName, () => _showFacilitySelector(tenants));
                            },
                            loading: () => const Center(
                              child: SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                              ),
                            ),
                            error: (e, __) => _buildFacilitySelectorButton('City Clinic (Offline)', () {
                              _showFacilitySelector([
                                {'id': '1', 'name': 'City Clinic'},
                                {'id': '2', 'name': 'Metropolis Diagnostics'},
                              ]);
                            }),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Tab Chip Toggles (Lookup vs SignUp)
                      Container(
                        height: 48,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() {
                                  _isSignUp = false;
                                  _errorMessage = null;
                                }),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: !_isSignUp ? AppColors.primary : Colors.transparent,
                                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                                  ),
                                  child: Text(
                                    'Sign In / Lookup',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: !_isSignUp ? Colors.white : AppColors.textTertiary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() {
                                  _isSignUp = true;
                                  _errorMessage = null;
                                }),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: _isSignUp ? AppColors.primary : Colors.transparent,
                                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                                  ),
                                  child: Text(
                                    'Register Profile',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: _isSignUp ? Colors.white : AppColors.textTertiary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Dynamic Height Form Card
                      Container(
                        decoration: AppTheme.cardDecoration(
                          shadow: AppTheme.shadowMedium,
                        ),
                        child: AnimatedSize(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeInOut,
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: _isSignUp ? _buildRegisterForm() : _buildLookupForm(),
                          ),
                        ),
                      ),

                      // Error box if any
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.errorSurface,
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                            border: Border.all(color: AppColors.errorLight),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: AppColors.error,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Tab 1: Lookup Form ──────────────────────────────────────────────────
  Widget _buildLookupForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Find Existing Patient Profile',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 4),
        const Text(
          'Enter phone number or medical records identifier (MRN) to synchronize your data.',
          style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.3),
        ),
        const SizedBox(height: 18),
        TextField(
          controller: _loginQueryController,
          keyboardType: TextInputType.text,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'Phone Number or MRN ID',
            prefixIcon: Icon(Icons.search_rounded, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _isLoading ? null : _handlePatientLookup,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusLg)),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Text(
                  'ACCESS PORTAL',
                  style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
        ),
      ],
    );
  }

  // ── Tab 2: Register Form ─────────────────────────────────────────────────
  Widget _buildRegisterForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Register New Patient Account',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 4),
        const Text(
          'Create a new digital profile in the selected hospital system.',
          style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.3),
        ),
        const SizedBox(height: 18),
        TextField(
          controller: _signUpNameController,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'Full Name',
            prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _signUpPhoneController,
          keyboardType: TextInputType.phone,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'Phone Number',
            prefixIcon: Icon(Icons.phone_outlined, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _signUpDobController,
          readOnly: true,
          onTap: _pickDate,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'Birth Date',
            prefixIcon: Icon(Icons.calendar_month_outlined, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Gender',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textTertiary, fontSize: 13),
        ),
        const SizedBox(height: 6),
        Row(
          children: ['Male', 'Female', 'Other']
              .map((g) => _buildGenderChip(g))
              .toList(),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _signUpEmailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'Email (Optional)',
            prefixIcon: Icon(Icons.email_outlined, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _signUpAbhaController,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          decoration: const InputDecoration(
            labelText: 'ABHA ID / Number (Optional)',
            prefixIcon: Icon(Icons.badge_outlined, color: AppColors.textHint, size: 20),
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _isLoading ? null : _handlePatientRegister,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusLg)),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Text(
                  'CREATE ACCOUNT',
                  style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
        ),
      ],
    );
  }

  Widget _buildFacilitySelectorButton(String text, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              const Icon(Icons.business_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'SELECTED HOSPITAL',
                      style: TextStyle(fontSize: 9, color: AppColors.textHint, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      text,
                      style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textHint),
            ],
          ),
        ),
      ),
    );
  }
}
