<template>
  <div
    class="p-6 max-w-6xl mx-auto space-y-6 relative min-h-screen flex flex-col items-center justify-center bg-gray-50"
  >
    <div class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-column"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
      <span class="text-2xl font-bold text-gray-800">PTracker</span>
    </div>
    
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
        >
          <Icon name="lucide:lock-keyhole" class="w-8 h-8 text-blue-500" />
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Welcome Back</h1>
        <p class="mt-2 text-gray-600">Enter your PIN to continue</p>
      </div>

      <!-- PIN Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="flex justify-center space-x-4">
          <input
            v-for="(digit, index) in 4"
            :key="index"
            type="password"
            :name="`pin-${index}`"
            v-model="pin[index]"
            @input="handlePinInput($event, index)"
            @keydown="handleKeyDown($event, index)"
            class="w-12 h-12 text-center text-2xl border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
            maxlength="1"
            autocomplete="off"
            required
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            type="button"
            @click="clearPin"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
            <span>Clear</span>
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <template v-if="loading">
              <Icon name="lucide:loader" class="w-5 h-5 animate-spin" />
            </template>
            <template v-else>
              <Icon name="lucide:arrow-right" class="w-5 h-5" />
            </template>
            <span>Enter</span>
          </button>
        </div>
      </form>

      <!-- Help Text -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Need help? Contact your administrator
        </p>
      </div>
    </div>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">PTracker © 2024</p>
    </div>
  </div>
</template>
<script setup>
const router = useRouter();
const pin = ref(["", "", "", ""]);
const error = ref("");
const loading = ref(false);

const handlePinInput = (event, index) => {
  const value = event.target.value;
  // Ensure only numbers
  if (isNaN(value)) {
    pin.value[index] = "";
    return;
  }

  // Update pin value
  pin.value[index] = value;

  // Auto-focus next input
  if (value && index < 3) {
    const nextInput = document.querySelector(`input[name=pin-${index + 1}]`);
    if (nextInput) nextInput.focus();
  }
};

const handleKeyDown = (event, index) => {
  // Handle backspace
  if (event.key === "Backspace" && !pin.value[index] && index > 0) {
    const prevInput = document.querySelector(`input[name=pin-${index - 1}]`);
    if (prevInput) {
      prevInput.focus();
      pin.value[index - 1] = "";
    }
  }
};

const clearPin = () => {
  pin.value = ["", "", "", ""];
  error.value = "";
  // Focus first input after clearing
  const firstInput = document.querySelector("input[name=pin-0]");
  if (firstInput) firstInput.focus();
};

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    const pinCode = pin.value.join("");
    if (pinCode.length !== 4) {
      error.value = "Please enter a 4-digit PIN";
      return;
    }

    // Check PIN and redirect accordingly
    if (pinCode === "8090" || pinCode === "1090") {
      localStorage.setItem("user_pin", pinCode);

      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Successfully logged in",
        color: "green",
      });

      // Redirect based on PIN
      if (pinCode === "8090") {
        router.push("/entry"); // Admin goes to dashboard
      } else {
        router.push("/entry"); // User goes to records
      }
    } else {
      error.value = "Invalid PIN";
      clearPin();
    }
  } catch (err) {
    console.error("Login error:", err);
    error.value = "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>
