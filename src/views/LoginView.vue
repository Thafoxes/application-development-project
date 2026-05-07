<script setup>
const imgLogoUtmReversePutih1 =
  'http://localhost:3845/assets/77ef8f9588a3fa002b1d280d8bcea5ad51e2d03d.png'
const imgLine1 = 'http://localhost:3845/assets/a78a2dcd9833684c6020633a4a83baec9a3c4ad0.svg'
</script>

<template>
  <div
    class="bg-[var(--utm-s1c1,#e7ded3)] content-stretch flex flex-col items-center justify-between pb-[258px] relative min-h-screen w-full font-['Inter']"
  >
    <!-- Heading -->
    <div
      class="bg-[#5c001f] gap-x-[15px] gap-y-[15px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[100px] px-[20px] py-[15px] relative shrink-0 w-full max-w-[1440px]"
    >
      <div
        class="col-start-1 content-stretch flex gap-[15px] items-center justify-self-start relative row-start-1 self-stretch shrink-0"
      >
        <!-- LOGO UTM -->
        <div class="h-[71.186px] overflow-clip relative shrink-0 w-[210px]">
          <div class="absolute h-[68.193px] left-0 top-0 w-[210.014px]">
            <img
              alt="LOGO UTM"
              class="absolute inset-0 max-w-none object-cover pointer-events-none w-full h-full"
              :src="imgLogoUtmReversePutih1"
            />
          </div>
        </div>
        <!-- Line -->
        <div class="flex h-[70px] items-center justify-center relative shrink-0 w-0">
          <div class="flex-none rotate-90">
            <div class="h-0 relative w-[70px]">
              <div class="absolute inset-[-1.76px_0_0_0]">
                <img alt="Line" class="block max-w-none w-full h-full" :src="imgLine1" />
              </div>
            </div>
          </div>
        </div>
        <!-- I-FAMOUS Text -->
        <p
          class="capitalize font-['Roboto'] font-bold leading-[normal] relative shrink-0 text-[48px] text-white whitespace-nowrap"
        >
          I-FAMOUS
        </p>
      </div>
    </div>

    <!-- Session Text -->
    <p
      class="font-['Inter'] font-bold leading-[normal] not-italic relative shrink-0 text-[40px] text-black whitespace-nowrap mt-20 mb-8"
    >
      Session 25262
    </p>

    <!-- Form Log In -->
    <div
      class="bg-[var(--sds-color-background-default-default,white)] border-[length:var(--sds-size-stroke-border,1px)] border-[var(--sds-color-border-default-default,#d9d9d9)] border-solid content-stretch flex flex-col gap-[var(--sds-size-space-600,24px)] items-start min-w-[320px] p-[var(--sds-size-space-600,24px)] relative rounded-[var(--sds-size-radius-200,8px)] shrink-0 w-[400px]"
    >
      <p
        class="capitalize font-['Roboto'] font-bold leading-[normal] relative shrink-0 text-[32px] text-[#5c001f] whitespace-nowrap self-center mb-2"
      >
        SIGN IN
      </p>

      <!-- Email Field -->
      <div class="flex flex-col gap-2 w-full">
        <label class="text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          placeholder="Value"
          class="border border-[#d9d9d9] rounded-[8px] px-4 py-3 outline-none focus:border-[#5c001f] focus:ring-1 focus:ring-[#5c001f] w-full"
        />
      </div>

      <!-- Password Field -->
      <div class="flex flex-col gap-2 w-full">
        <label class="text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          placeholder="Value"
          class="border border-[#d9d9d9] rounded-[8px] px-4 py-3 outline-none focus:border-[#5c001f] focus:ring-1 focus:ring-[#5c001f] w-full"
        />
      </div>

      <!-- Submit Button -->
      <button
        class="bg-[#5c001f] hover:bg-[#4a0019] text-white rounded-[8px] py-3 font-medium transition-colors w-full mt-2"
      >
        Sign In
      </button>

      <!-- Forgot Password Text Link -->
      <div class="w-full flex justify-center mt-[-8px]">
        <a
          href="#"
          class="text-[#5c001f] hover:underline text-sm font-medium decoration-solid underline-offset-4"
        >
          Forgot password?
        </a>
      </div>

      <!-- Text Sign up -->
      <div
        class="border-black border-solid border-t content-stretch flex font-['Inter'] font-[400] gap-[10px] items-center justify-center leading-[0] not-italic py-[15px] mt-2 relative shrink-0 whitespace-nowrap w-full"
      >
        <div class="flex flex-col justify-center relative shrink-0 text-[0px] text-white">
          <p class="font-['Inter'] font-normal text-[16px]">
            <span class="leading-[1.4] text-black">New here? Create An Account →</span>
            <span class="leading-[1.4]"> </span>
          </p>
        </div>
        <div class="flex flex-col justify-center relative shrink-0 text-[#5c001f] text-[16px]">
          <p class="[text-decoration-skip-ink:none] decoration-solid leading-[1.4] underline">
            SIGN UP
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
