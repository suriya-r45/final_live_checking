import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAdmin, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && isAdmin) {
      setLocation('/admin');
    } else if (user) {
      setLocation('/');
    }
  }, [user, isAdmin, setLocation]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginResult = await login(email, password);
      toast({
        title: "Login Successful",
        description: `Welcome ${loginResult?.role === 'admin' ? 'Admin' : 'Guest'}!`,
      });
      
      setTimeout(() => {
        if (loginResult?.role === 'admin') {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast({
        title: "Registration Successful",
        description: `Welcome ${data.user.name}! You can now browse and purchase products.`,
      });
      
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" data-testid="page-login">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
          {/* Login Tab */}
          <TabsContent value="login" className="space-y-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Log In Using</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-base font-medium text-gray-700 mb-2 block">
                      Email Address / Mobile Number*
                    </Label>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900"
                      data-testid="input-email"
                      placeholder="Enter email or mobile number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-base font-medium text-gray-700 mb-2 block">
                      Enter Password*
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900 pr-16"
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "HIDE" : "SHOW"}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-rose-900 to-red-900 hover:from-rose-800 hover:to-red-800 text-white text-lg font-semibold rounded-lg mt-8"
                    disabled={isLoading}
                    data-testid="button-submit-login"
                  >
                    {isLoading ? 'SIGNING IN...' : 'LOGIN TO CONTINUE'}
                  </Button>
                </form>

                <div className="flex justify-between items-center mt-8">
                  <Button 
                    variant="link" 
                    className="text-rose-900 hover:text-red-900 font-semibold p-0"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Password reset functionality will be available soon.",
                      });
                    }}
                  >
                    Forgot Password?
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-rose-900 hover:text-red-900 font-semibold p-0"
                    onClick={() => setActiveTab('register')}
                  >
                    Create New Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign Up With Palaniappa</h1>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <Label htmlFor="register-firstname" className="text-base font-medium text-gray-700 mb-2 block">
                      First Name*
                    </Label>
                    <div className="flex space-x-3">
                      <Select defaultValue="mr">
                        <SelectTrigger className="w-20 h-14 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Mr</SelectItem>
                          <SelectItem value="mrs">Mrs</SelectItem>
                          <SelectItem value="ms">Ms</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="register-firstname"
                        type="text"
                        value={registerForm.name.split(' ')[0] || ''}
                        onChange={(e) => {
                          const lastName = registerForm.name.split(' ').slice(1).join(' ');
                          setRegisterForm({...registerForm, name: `${e.target.value} ${lastName}`.trim()});
                        }}
                        required
                        className="flex-1 h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-lastname" className="text-base font-medium text-gray-700 mb-2 block">
                      Last Name*
                    </Label>
                    <Input
                      id="register-lastname"
                      type="text"
                      value={registerForm.name.split(' ').slice(1).join(' ') || ''}
                      onChange={(e) => {
                        const firstName = registerForm.name.split(' ')[0] || '';
                        setRegisterForm({...registerForm, name: `${firstName} ${e.target.value}`.trim()});
                      }}
                      required
                      className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="register-email" className="text-base font-medium text-gray-700 mb-2 block">
                      Email Address*
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      required
                      className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="register-phone" className="text-base font-medium text-gray-700 mb-2 block">
                      Mobile No*
                    </Label>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
                        <svg className="w-6 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                          <rect width="24" height="8" fill="#FF9933"/>
                          <rect y="8" width="24" height="8" fill="#FFFFFF"/>
                          <rect y="16" width="24" height="8" fill="#138808"/>
                        </svg>
                        <span className="text-sm">+91</span>
                      </div>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={registerForm.phone.replace('+91', '')}
                        onChange={(e) => setRegisterForm({...registerForm, phone: `+91${e.target.value}`})}
                        required
                        className="h-14 text-base border-gray-300 rounded-l-none rounded-r-lg focus:border-rose-900 focus:ring-rose-900"
                        placeholder="Mobile number"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-password" className="text-base font-medium text-gray-700 mb-2 block">
                        Enter Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                          required
                          className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900 pr-16"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "HIDE" : "SHOW"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-confirm-password" className="text-base font-medium text-gray-700 mb-2 block">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-confirm-password"
                          type={showPassword ? "text" : "password"}
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                          required
                          className="h-14 text-base border-gray-300 rounded-lg focus:border-rose-900 focus:ring-rose-900 pr-16"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "HIDE" : "SHOW"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-rose-900 to-red-900 hover:from-rose-800 hover:to-red-800 text-white text-lg font-semibold rounded-lg mt-8"
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'CREATING ACCOUNT...' : 'REGISTER TO CONTINUE'}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <span className="text-gray-600">Already have an account? </span>
                  <Button 
                    variant="link" 
                    className="text-rose-900 hover:text-red-900 font-semibold p-0"
                    onClick={() => setActiveTab('login')}
                  >
                    Log In!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}