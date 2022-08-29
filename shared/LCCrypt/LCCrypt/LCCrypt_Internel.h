#ifndef __LC_CRYPT_INTERNEL_H__
#define __LC_CRYPT_INTERNEL_H__

// ��ȣŰ �ʱ� ��
#define CNM_INIT_KEY		((unsigned int)(1852535664))	// �ʱ� Ű �� : nksp

// 4����Ʈ �������� �� ����Ʈ ���� unsigned char�� ����, ���� ����Ʈ 0 ~ �ֻ��� ����Ʈ 3
#define LCCNM_BYTE_0(n)		((unsigned char)((n      ) & 0x000000ff))
#define LCCNM_BYTE_1(n)		((unsigned char)((n >>  8) & 0x000000ff))
#define LCCNM_BYTE_2(n)		((unsigned char)((n >> 16) & 0x000000ff))
#define LCCNM_BYTE_3(n)		((unsigned char)((n >> 24) & 0x000000ff))

#define LCCNM_DUMMY_SIZE		(1)								// ���� ������ : ���̴� �޽��� Ÿ�� ��ſ� CNetMsg���� ���
#define LCCNM_BEGIN_SIZE		(1)								// ���� ��ũ ũ��
#define LCCNM_END_SIZE			(1)								// �� ��ũ ũ��
#define LCCNM_CHECKSUM_SIZE		(2)								// üũ�� ũ��

#define LCCNM_DUMMY_TYPE		((unsigned char)1)				// ����
#define LCCNM_BEGIN_MARK		((unsigned char)('l'))			// ���� ��ũ : l
#define LCCNM_END_MARK		((unsigned char)('c'))			// ���� ��ũ : c

#define LCCNM_CRC				(0x8003)						// CRC-16

#define LCCNM_ROTATE_RIGHT(n)	((unsigned char)((((n << 7) & 0x80) | ((n >> 1) & 0x7f)) & 0xff))
#define LCCNM_ROTATE_LEFT(n)	((unsigned char)(((n >> 7) & 0x01) | ((n << 1) & 0xfe) & 0xff))

#define LCCNM_MAKEWORD(low, high)			((unsigned short)(((high << 8) & 0xff00) | (low & 0x00ff)))
#define LCCNM_MAKELONG(b0, b1, b2, b3)	((unsigned int)((b0 & 0x000000ff) | ((b1 << 8) & 0x0000ff00) | ((b2 << 16) & 0x00ff0000) | ((b3 << 24) & 0xff000000)))

// return value		��ȣȭ�� ����, ������ -1
// pSrc				���� ������
// nLenSrc			���� ����
// nKey				��ȣŰ
// pDest			��ȣ ������ ����
int LCCrypt_Crypt(const unsigned char* pSrc, int nLenSrc, unsigned int nKey, unsigned char* pDest);

// return value		��ȣ�� ����, ������ -1
// pSrc				��ȣ ������
// nLenSrc			��ȣ ����
// nKey				��ȣŰ
// pDest			�� ������ ����
// pTmpBuf			��ȯ �ӽ� ����
int LCCrypt_Decrypt(const unsigned char* pSrc, int nLenSrc, unsigned int nKey, unsigned char* pDest, unsigned char* pTmpBuf);

#endif // __LC_CRYPT_INTERNEL_H__
