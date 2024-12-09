export const COPYRIGHT_NOTICE = `
@license
            
Copyright (C) 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG")
Copyright (C) 2024 Ted Gao ("skjsjhb")
            
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
            
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
`;

export const DEV_SERVER_PORT = 9000;

const isDev = !process.env.NODE_ENV?.includes("prod");

// BMCLAPI provides mirrors to speed up resources delivering in some regions.
// As a non-free third-party service, it's not enabled by default.
// By changing the option to 'true' you agree the terms and conditions listed at <https://bmclapi2.bangbang93.com>.
const enableBMCLAPI = false;

export const buildDefines = {
    "import.meta.env.AL_DEV": JSON.stringify(isDev),
    "import.meta.env.AL_ENABLE_BMCLAPI": JSON.stringify(enableBMCLAPI),
    "import.meta.env.AL_DEV_SERVER_PORT": JSON.stringify(DEV_SERVER_PORT)
};